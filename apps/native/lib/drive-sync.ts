import { File } from "expo-file-system";
import type { SQLiteDatabase } from "expo-sqlite";
import { z } from "zod";

import {
  decryptDriveFile,
  decryptDriveManifest,
  deleteDriveBackupFile,
  encryptDriveManifest,
  encryptFileForDrive,
  isEncryptedDriveFile,
} from "@/lib/drive-backup-crypto";
import { unlockDatabase } from "@/lib/database";
import {
  applySyncedDocumentDeletion,
  applySyncedDocumentMetadata,
  importSyncedDocument,
  listDocuments,
  listDocumentTombstones,
} from "@/lib/document-repository";
import { DOCUMENT_FILE_EXTENSION_PATTERN, DOCUMENT_ID_PATTERN } from "@/lib/document-file";
import {
  applySyncedFolderDeletion,
  applySyncedFolderMetadata,
  importSyncedFolder,
  listFolders,
  listFolderTombstones,
} from "@/lib/folder-repository";
import { GoogleDriveClient } from "@/lib/google-drive-client";
import { withDriveRecoveryKeyLock } from "@/lib/drive-recovery-key";
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
import { DOCUMENT_KINDS, type VaultDocument, type VaultFolder } from "@/types/document";
import type {
  DriveManifest,
  DriveManifestDocument,
  DriveManifestFolder,
  SyncReport,
} from "@/types/sync";

const legacyManifestDocumentSchema = z.object({
  id: z.string().regex(DOCUMENT_ID_PATTERN),
  title: z.string(),
  kind: z.enum(DOCUMENT_KINDS),
  originalName: z.string(),
  mimeType: z.string(),
  fileExtension: z.string().regex(DOCUMENT_FILE_EXTENSION_PATTERN),
  fileSize: z.number().nonnegative(),
  expiresAt: z.string().nullable(),
  notes: z.string(),
  isFavorite: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  remoteFileId: z.string().nullable(),
  deletedAt: z.string().nullable(),
});

const manifestDocumentSchema = legacyManifestDocumentSchema.extend({
  folderId: z.string().nullable(),
});

const manifestFolderSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

const legacyManifestSchema = z.object({
  schema: z.literal(1),
  documents: z.array(legacyManifestDocumentSchema),
  updatedAt: z.string(),
});

const manifestSchema = z.object({
  schema: z.literal(2),
  folders: z.array(manifestFolderSchema),
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
  return { schema: 2, folders: [], documents: [], updatedAt: new Date(0).toISOString() };
}

function toManifestDocument(
  document: VaultDocument,
  remoteFileId: string | null,
): DriveManifestDocument {
  return {
    id: document.id,
    title: document.title,
    kind: document.kind,
    folderId: document.folderId,
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

function toManifestFolder(folder: VaultFolder): DriveManifestFolder {
  return { ...folder, deletedAt: null };
}

async function readManifest(client: GoogleDriveClient, fileId: string | null) {
  if (!fileId) return { manifest: emptyManifest(), etag: null };
  const remote = await client.downloadManifest(fileId);
  if (!remote.content.trim()) return { manifest: emptyManifest(), etag: remote.etag };
  const content = await decryptDriveManifest(remote.content);
  const parsed = JSON.parse(content);
  const current = manifestSchema.safeParse(parsed);
  if (current.success) return { manifest: current.data, etag: remote.etag };
  const legacy = legacyManifestSchema.parse(parsed);
  return {
    manifest: {
      schema: 2,
      folders: [],
      documents: legacy.documents.map((document) => ({ ...document, folderId: null })),
      updatedAt: legacy.updatedAt,
    } satisfies DriveManifest,
    etag: remote.etag,
  };
}

export async function syncDriveVault({
  ...options
}: {
  db: SQLiteDatabase;
  accessToken: string;
  accountId: string;
}): Promise<SyncReport> {
  return withDriveRecoveryKeyLock(() => syncDriveVaultLocked(options));
}

async function syncDriveVaultLocked({
  db,
  accessToken,
  accountId,
}: {
  db: SQLiteDatabase;
  accessToken: string;
  accountId: string;
}): Promise<SyncReport> {
  await unlockDatabase(db);
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
  const localFolders = await listFolders(db);
  const remoteFolderById = new Map(manifest.folders.map((folder) => [folder.id, folder]));
  const localFolderById = new Map(localFolders.map((folder) => [folder.id, folder]));
  const folderTombstones = await listFolderTombstones(db);
  const folderTombstoneById = new Map(folderTombstones.map((item) => [item.folder_id, item]));

  for (const tombstone of folderTombstones) {
    const remote = remoteFolderById.get(tombstone.folder_id);
    if (remote?.deletedAt && remote.deletedAt >= tombstone.deleted_at) continue;
    remoteFolderById.set(tombstone.folder_id, {
      id: tombstone.folder_id,
      name: remote?.name ?? "Deleted folder",
      createdAt: remote?.createdAt ?? tombstone.deleted_at,
      updatedAt: tombstone.deleted_at,
      deletedAt: tombstone.deleted_at,
    });
  }

  for (const remote of [...remoteFolderById.values()]) {
    const local = localFolderById.get(remote.id);
    if (remote.deletedAt) {
      if (local && remote.deletedAt > local.updatedAt) {
        await applySyncedFolderDeletion(db, remote.id, remote.deletedAt);
        localFolderById.delete(remote.id);
      }
      continue;
    }
    const tombstone = folderTombstoneById.get(remote.id);
    if (tombstone && tombstone.deleted_at >= remote.updatedAt) continue;
    if (!local) {
      await importSyncedFolder(db, remote);
      localFolderById.set(remote.id, remote);
    } else if (remote.updatedAt > local.updatedAt) {
      await applySyncedFolderMetadata(db, remote);
      localFolderById.set(remote.id, remote);
    }
  }

  for (const local of localFolders) {
    if (!localFolderById.has(local.id)) continue;
    const remote = remoteFolderById.get(local.id);
    if (!remote || remote.deletedAt || local.updatedAt > remote.updatedAt) {
      remoteFolderById.set(local.id, toManifestFolder(local));
    }
  }

  const liveFolderIds = new Set(
    [...remoteFolderById.values()].filter((folder) => !folder.deletedAt).map((folder) => folder.id),
  );
  const documents = await listDocuments(db);
  const remoteById = new Map(
    manifest.documents.map((document) => [
      document.id,
      {
        ...document,
        folderId: document.folderId && liveFolderIds.has(document.folderId) ? document.folderId : null,
      },
    ]),
  );
  const localById = new Map(documents.map((document) => [document.id, document]));
  const tombstones = await listDocumentTombstones(db);
  const tombstoneById = new Map(tombstones.map((item) => [item.document_id, item]));
  const folderFiles = await client.listFolderDocuments(folderId);
  const liveRemoteFileIds = new Set(folderFiles.map((file) => file.id));
  const remoteFilesByDocumentId = new Map<string, typeof folderFiles>();
  for (const file of folderFiles) {
    const documentId = file.appProperties?.berkasDocumentId;
    if (!documentId) continue;
    const matches = remoteFilesByDocumentId.get(documentId) ?? [];
    matches.push(file);
    remoteFilesByDocumentId.set(documentId, matches);
  }
  let uploaded = 0;
  let downloaded = 0;
  let deleted = 0;

  for (const tombstone of tombstones) {
    const remote = remoteById.get(tombstone.document_id);
    if (!remote || (remote.deletedAt && remote.deletedAt >= tombstone.deleted_at)) continue;
    const matchingFileIds = new Set(remoteFilesByDocumentId.get(tombstone.document_id)?.map((file) => file.id));
    if (remote.remoteFileId && liveRemoteFileIds.has(remote.remoteFileId)) {
      matchingFileIds.add(remote.remoteFileId);
    }
    for (const fileId of matchingFileIds) {
      await client.trashFile(fileId);
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
    const referencedFile = remote.remoteFileId ? await client.getFile(remote.remoteFileId) : null;
    const orphan = remoteFilesByDocumentId.get(remote.id)?.[0];
    const remoteFile = referencedFile &&
      !referencedFile.trashed &&
      referencedFile.appProperties?.berkasDocumentId === remote.id
      ? referencedFile
      : orphan;
    if (!local && remoteFile && !remoteFile.trashed) {
      const bytes = await client.downloadBytes(remoteFile.id);
      const encrypted = remoteFile.appProperties?.berkasEncryption?.startsWith("aes-gcm-") ||
        isEncryptedDriveFile(bytes);
      const sourceUri = encrypted
        ? await decryptDriveFile(
            bytes,
            remote.id,
            remote.fileExtension,
            remoteFile.appProperties?.berkasEncryption,
          )
        : writeTemporarySource(bytes, remote.fileExtension);
      try {
        const notificationId = await scheduleExpiryReminder(remote.title, remote.expiresAt);
        await importSyncedDocument(
          db,
          { ...remote, folderId: remote.folderId && liveFolderIds.has(remote.folderId) ? remote.folderId : null, sourceUri },
          notificationId,
        );
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
      await applySyncedDocumentMetadata(
        db,
        { ...remote, folderId: remote.folderId && liveFolderIds.has(remote.folderId) ? remote.folderId : null },
        notificationId,
      );
    }
  }

  const syncedDocuments = await listDocuments(db);
  for (const local of syncedDocuments) {
    const remote = remoteById.get(local.id);
    const matchingRemoteFiles = remoteFilesByDocumentId.get(local.id) ?? [];
    const orphan = matchingRemoteFiles[0];
    const referencedFile = remote?.remoteFileId ? await client.getFile(remote.remoteFileId) : null;
    const usableRemoteFile = referencedFile &&
      !referencedFile.trashed &&
      referencedFile.appProperties?.berkasDocumentId === local.id
      ? referencedFile
      : orphan?.appProperties?.berkasDocumentId === local.id
        ? orphan
        : null;
    const usableRemoteFileId = usableRemoteFile?.id ?? null;
    const remoteFileMissing = usableRemoteFile?.appProperties?.berkasEncryption !== "aes-gcm-v2";
    if (remote && !remote.deletedAt && remote.updatedAt >= local.updatedAt && !remoteFileMissing) {
      continue;
    }

    const preview = await decryptForPreview(
      local.encryptedUri,
      local.id,
      local.fileExtension,
    );
    let backup: File | null = null;
    try {
      backup = await encryptFileForDrive(preview, local.id);
      const remoteFileId = await client.uploadDocument({
        file: backup,
        folderId,
        documentId: local.id,
        title: local.id,
        extension: ".berkas",
        mimeType: "application/octet-stream",
        remoteFileId: usableRemoteFileId,
      });
      for (const duplicate of matchingRemoteFiles) {
        if (duplicate.id !== remoteFileId) await client.trashFile(duplicate.id);
      }
      remoteById.set(local.id, toManifestDocument(local, remoteFileId));
      uploaded += 1;
    } finally {
      if (backup) deleteDriveBackupFile(backup);
      deletePreviewFile(local.id, local.fileExtension);
    }
  }

  const lastSyncedAt = new Date().toISOString();
  const nextManifest: DriveManifest = {
    schema: 2,
    folders: [...remoteFolderById.values()],
    documents: [...remoteById.values()],
    updatedAt: lastSyncedAt,
  };
  const manifestFileId = await client.uploadManifest(
    await encryptDriveManifest(JSON.stringify(nextManifest)),
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
