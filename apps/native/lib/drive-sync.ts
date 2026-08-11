import { File } from "expo-file-system";
import type { SQLiteDatabase } from "expo-sqlite";
import { z } from "zod";

import {
  applySyncedDocumentDeletion,
  applySyncedDocumentMetadata,
  getDocument,
  importSyncedDocument,
  listDocumentTombstones,
} from "@/lib/document-repository";
import { GoogleDriveClient } from "@/lib/google-drive-client";
import {
  cancelExpiryReminder,
  scheduleExpiryReminder,
} from "@/lib/notifications";
import {
  decryptForPreview,
  deletePreviewFile,
  deleteVaultFile,
  writeTemporarySource,
} from "@/lib/vault-crypto";
import { DOCUMENT_KINDS, type VaultDocument } from "@/types/document";
import type {
  DriveManifest,
  DriveManifestDocument,
  SyncReport,
} from "@/types/sync";

const MAX_SYNC_FILE_BYTES = 25 * 1024 * 1024;

const manifestDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  kind: z.enum(DOCUMENT_KINDS),
  originalName: z.string(),
  mimeType: z.string(),
  fileExtension: z.string(),
  fileSize: z.number().nonnegative().max(MAX_SYNC_FILE_BYTES),
  expiresAt: z.string().nullable(),
  notes: z.string(),
  isFavorite: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  remoteFileId: z.string().nullable(),
  deletedAt: z.string().nullable(),
});

const manifestSchema = z.object({
  schema: z.literal(1),
  documents: z.array(manifestDocumentSchema),
  updatedAt: z.string(),
});

export class DriveAccountMismatchError extends Error {
  constructor() {
    super("This vault is connected to a different Google account.");
    this.name = "DriveAccountMismatchError";
  }
}

function emptyManifest(): DriveManifest {
  return { schema: 1, documents: [], updatedAt: new Date(0).toISOString() };
}

function toManifestDocument(
  document: VaultDocument,
  remoteFileId: string | null,
): DriveManifestDocument {
  return {
    id: document.id,
    title: document.title,
    kind: document.kind,
    originalName: document.originalName,
    mimeType: document.mimeType,
    fileExtension: document.fileExtension,
    fileSize: document.fileSize,
    expiresAt: document.expiresAt,
    notes: document.notes,
    isFavorite: document.isFavorite,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    remoteFileId,
    deletedAt: null,
  };
}

async function readManifest(client: GoogleDriveClient, fileId: string | null) {
  if (!fileId) return { manifest: emptyManifest(), etag: null };
  const remote = await client.downloadManifest(fileId);
  if (!remote.content.trim()) return { manifest: emptyManifest(), etag: remote.etag };
  return {
    manifest: manifestSchema.parse(JSON.parse(remote.content)),
    etag: remote.etag,
  };
}

export async function syncDriveVault({
  db,
  accessToken,
  accountId,
  documents,
}: {
  db: SQLiteDatabase;
  accessToken: string;
  accountId: string;
  documents: VaultDocument[];
}): Promise<SyncReport> {
  const bound = await db.getFirstAsync<{
    google_account_id: string;
    folder_id: string | null;
    manifest_file_id: string | null;
  }>("SELECT google_account_id, folder_id, manifest_file_id FROM drive_sync_state WHERE singleton_id = 1");
  if (bound && bound.google_account_id !== accountId) throw new DriveAccountMismatchError();

  const client = new GoogleDriveClient(accessToken);
  const folderId = await client.ensureBerkasFolder(bound?.folder_id ?? null);
  await db.runAsync(
    `INSERT INTO drive_sync_state (singleton_id, google_account_id, folder_id)
     VALUES (1, ?, ?)
     ON CONFLICT(singleton_id) DO UPDATE SET folder_id = excluded.folder_id`,
    accountId,
    folderId,
  );
  const storedManifest = bound?.manifest_file_id
    ? await client.getFile(bound.manifest_file_id)
    : null;
  const manifestFile = storedManifest ?? (await client.findManifest());
  const remoteManifest = await readManifest(client, manifestFile?.id ?? null);
  const manifest = remoteManifest.manifest;
  const remoteById = new Map(manifest.documents.map((document) => [document.id, document]));
  const localById = new Map(documents.map((document) => [document.id, document]));
  const tombstones = await listDocumentTombstones(db);
  const tombstoneById = new Map(tombstones.map((item) => [item.document_id, item]));
  const folderFiles = await client.listFolderDocuments(folderId);
  const liveRemoteFileIds = new Set(folderFiles.map((file) => file.id));
  const orphanByDocumentId = new Map(
    folderFiles
      .filter((file) => file.appProperties?.berkasDocumentId)
      .map((file) => [file.appProperties!.berkasDocumentId!, file]),
  );
  let uploaded = 0;
  let downloaded = 0;
  let deleted = 0;

  for (const tombstone of tombstones) {
    const remote = remoteById.get(tombstone.document_id);
    if (!remote || (remote.deletedAt && remote.deletedAt >= tombstone.deleted_at)) continue;
    if (remote.remoteFileId && liveRemoteFileIds.has(remote.remoteFileId)) {
      await client.trashFile(remote.remoteFileId);
    }
    remoteById.set(tombstone.document_id, {
      ...remote,
      remoteFileId: null,
      deletedAt: tombstone.deleted_at,
      updatedAt: tombstone.deleted_at,
    });
    deleted += 1;
  }

  for (const remote of [...remoteById.values()]) {
    const local = localById.get(remote.id);
    if (remote.deletedAt) {
      if (local && remote.deletedAt > local.updatedAt) {
        await applySyncedDocumentDeletion(db, local.id, remote.deletedAt);
        deleteVaultFile(local.encryptedUri);
        deletePreviewFile(local.id, local.fileExtension);
        await cancelExpiryReminder(local.notificationId);
        localById.delete(local.id);
        deleted += 1;
      }
      continue;
    }

    if (!local && tombstoneById.has(remote.id)) continue;
    const remoteFile = remote.remoteFileId ? await client.getFile(remote.remoteFileId) : null;
    if (!local && remoteFile && !remoteFile.trashed) {
      const bytes = await client.downloadBytes(remoteFile.id);
      if (bytes.byteLength > MAX_SYNC_FILE_BYTES) throw new Error("A Drive document exceeds 25 MB.");
      const sourceUri = writeTemporarySource(bytes, remote.fileExtension);
      try {
        const notificationId = await scheduleExpiryReminder(remote.title, remote.expiresAt);
        await importSyncedDocument(db, { ...remote, sourceUri }, notificationId);
      } catch (error) {
        const temporary = new File(sourceUri);
        if (temporary.exists) temporary.delete();
        throw error;
      }
      downloaded += 1;
      continue;
    }

    if (local && remote.updatedAt > local.updatedAt) {
      await cancelExpiryReminder(local.notificationId);
      const notificationId = await scheduleExpiryReminder(remote.title, remote.expiresAt);
      await applySyncedDocumentMetadata(db, remote, notificationId);
    }
  }

  for (const local of documents) {
    if (!localById.has(local.id)) continue;
    const remote = remoteById.get(local.id);
    const orphan = orphanByDocumentId.get(local.id);
    const referencedFile = remote?.remoteFileId ? await client.getFile(remote.remoteFileId) : null;
    const usableRemoteFileId = referencedFile && !referencedFile.trashed
      ? referencedFile.id
      : (orphan?.id ?? null);
    const remoteFileMissing = !usableRemoteFileId;
    if (remote && !remote.deletedAt && remote.updatedAt >= local.updatedAt && !remoteFileMissing) {
      continue;
    }

    const preview = await decryptForPreview(
      local.encryptedUri,
      local.id,
      local.fileExtension,
    );
    try {
      const remoteFileId = await client.uploadDocument({
        file: new File(preview.uri),
        folderId,
        documentId: local.id,
        title: local.title,
        extension: local.fileExtension,
        mimeType: local.mimeType,
        remoteFileId: usableRemoteFileId,
      });
      remoteById.set(local.id, toManifestDocument(local, remoteFileId));
      uploaded += 1;
    } finally {
      deletePreviewFile(local.id, local.fileExtension);
    }
  }

  const lastSyncedAt = new Date().toISOString();
  const nextManifest: DriveManifest = {
    schema: 1,
    documents: [...remoteById.values()],
    updatedAt: lastSyncedAt,
  };
  const manifestFileId = await client.uploadManifest(
    JSON.stringify(nextManifest),
    manifestFile?.id ?? null,
    remoteManifest.etag,
  );
  await db.runAsync(
    `INSERT INTO drive_sync_state
      (singleton_id, google_account_id, folder_id, manifest_file_id, last_synced_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(singleton_id) DO UPDATE SET
       folder_id = excluded.folder_id,
       manifest_file_id = excluded.manifest_file_id,
       last_synced_at = excluded.last_synced_at`,
    accountId,
    folderId,
    manifestFileId,
    lastSyncedAt,
  );

  return { uploaded, downloaded, deleted, lastSyncedAt };
}
