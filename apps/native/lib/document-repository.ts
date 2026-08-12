import type { SQLiteDatabase } from "expo-sqlite";

import { FREE_DOCUMENT_LIMIT, FreeDocumentLimitError } from "@/lib/access-policy";
import { unlockDatabase } from "@/lib/database";
import { deleteTemporarySource, deleteVaultFile, encryptIntoVault } from "@/lib/vault-crypto";
import type { DocumentKind, NewVaultDocument, VaultDocument } from "@/types/document";

type DocumentRow = {
  id: string;
  title: string;
  kind: DocumentKind;
  folder_id: string | null;
  encrypted_uri: string;
  original_name: string;
  mime_type: string;
  file_extension: string;
  file_size: number;
  expires_at: string | null;
  notes: string;
  is_favorite: number;
  notification_id: string | null;
  created_at: string;
  updated_at: string;
};

type SyncedDocumentInput = Omit<NewVaultDocument, "sourceUri"> & {
  id: string;
  sourceUri: string;
  fileSize: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

function rowToDocument(row: DocumentRow): VaultDocument {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    folderId: row.folder_id,
    encryptedUri: row.encrypted_uri,
    originalName: row.original_name,
    mimeType: row.mime_type,
    fileExtension: row.file_extension,
    fileSize: row.file_size,
    expiresAt: row.expires_at,
    notes: row.notes,
    isFavorite: row.is_favorite === 1,
    notificationId: row.notification_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listDocuments(db: SQLiteDatabase) {
  await unlockDatabase(db);
  const rows = await db.getAllAsync<DocumentRow>(
    "SELECT * FROM documents ORDER BY is_favorite DESC, updated_at DESC",
  );
  return rows.map(rowToDocument);
}

export async function getDocument(db: SQLiteDatabase, id: string) {
  await unlockDatabase(db);
  const row = await db.getFirstAsync<DocumentRow>("SELECT * FROM documents WHERE id = ?", id);
  return row ? rowToDocument(row) : null;
}

export async function createDocument(
  db: SQLiteDatabase,
  input: NewVaultDocument,
  notificationId: string | null,
  isPro: boolean,
) {
  await unlockDatabase(db);
  const id = QuickId.create();
  const now = new Date().toISOString();
  const encrypted = await encryptIntoVault(input.sourceUri, id);

  try {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await unlockDatabase(transaction);
      if (!isPro) {
        const count = await transaction.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) AS count FROM documents",
        );
        if ((count?.count ?? 0) >= FREE_DOCUMENT_LIMIT) throw new FreeDocumentLimitError();
      }

      await transaction.runAsync(
      `INSERT INTO documents (
        id, title, kind, folder_id, encrypted_uri, original_name, mime_type, file_extension,
        file_size, expires_at, notes, is_favorite, notification_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      id,
      input.title.trim(),
      input.kind,
      input.folderId,
      encrypted.uri,
      input.originalName,
      input.mimeType,
      input.fileExtension,
      encrypted.fileSize,
      input.expiresAt,
      input.notes.trim(),
      notificationId,
      now,
      now,
      );
    });
  } catch (error) {
    deleteVaultFile(encrypted.uri);
    throw error;
  }

  deleteTemporarySource(input.sourceUri);

  return id;
}

export async function importSyncedDocument(
  db: SQLiteDatabase,
  input: SyncedDocumentInput,
  notificationId: string | null,
) {
  await unlockDatabase(db);
  const encrypted = await encryptIntoVault(input.sourceUri, input.id);
  try {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await unlockDatabase(transaction);
      await transaction.runAsync(
        `INSERT OR IGNORE INTO documents (
          id, title, kind, folder_id, encrypted_uri, original_name, mime_type, file_extension,
          file_size, expires_at, notes, is_favorite, notification_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        input.id,
        input.title.trim(),
        input.kind,
        input.folderId,
        encrypted.uri,
        input.originalName,
        input.mimeType,
        input.fileExtension,
        encrypted.fileSize,
        input.expiresAt,
        input.notes.trim(),
        input.isFavorite ? 1 : 0,
        notificationId,
        input.createdAt,
        input.updatedAt,
      );
      await transaction.runAsync(
        "DELETE FROM document_tombstones WHERE document_id = ?",
        input.id,
      );
    });
  } catch (error) {
    deleteVaultFile(encrypted.uri);
    throw error;
  } finally {
    deleteTemporarySource(input.sourceUri);
  }
}

export async function applySyncedDocumentMetadata(
  db: SQLiteDatabase,
  input: Omit<SyncedDocumentInput, "sourceUri">,
  notificationId: string | null,
) {
  await unlockDatabase(db);
  await db.runAsync(
    `UPDATE documents SET
      title = ?, kind = ?, folder_id = ?, original_name = ?, mime_type = ?, file_extension = ?,
      file_size = ?, expires_at = ?, notes = ?, is_favorite = ?, notification_id = ?,
      updated_at = ?
     WHERE id = ?`,
    input.title.trim(),
    input.kind,
    input.folderId,
    input.originalName,
    input.mimeType,
    input.fileExtension,
    input.fileSize,
    input.expiresAt,
    input.notes.trim(),
    input.isFavorite ? 1 : 0,
    notificationId,
    input.updatedAt,
    input.id,
  );
}

export async function applySyncedDocumentDeletion(
  db: SQLiteDatabase,
  id: string,
  deletedAt: string,
) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    const changedAt = new Date().toISOString();
    await transaction.runAsync(
      `UPDATE processes SET archived_at = NULL, updated_at = ?
       WHERE archived_at IS NOT NULL AND id IN (
         SELECT process_id FROM process_requirements WHERE document_id = ?
       )`,
      changedAt,
      id,
    );
    await transaction.runAsync(
      "UPDATE process_requirements SET document_id = NULL, is_confirmed = 0 WHERE document_id = ?",
      id,
    );
    await transaction.runAsync(
      "INSERT OR REPLACE INTO document_tombstones (document_id, deleted_at) VALUES (?, ?)",
      id,
      deletedAt,
    );
    await transaction.runAsync("DELETE FROM documents WHERE id = ?", id);
  });
}

export async function setFavorite(db: SQLiteDatabase, id: string, isFavorite: boolean) {
  await unlockDatabase(db);
  await db.runAsync(
    "UPDATE documents SET is_favorite = ?, updated_at = ? WHERE id = ?",
    isFavorite ? 1 : 0,
    new Date().toISOString(),
    id,
  );
}

export async function setDocumentFolder(db: SQLiteDatabase, id: string, folderId: string | null) {
  await unlockDatabase(db);
  await db.runAsync(
    "UPDATE documents SET folder_id = ?, updated_at = ? WHERE id = ?",
    folderId,
    new Date().toISOString(),
    id,
  );
}

export async function removeDocument(db: SQLiteDatabase, id: string) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    const changedAt = new Date().toISOString();
    await transaction.runAsync(
      `UPDATE processes SET archived_at = NULL, updated_at = ?
       WHERE archived_at IS NOT NULL AND id IN (
         SELECT process_id FROM process_requirements WHERE document_id = ?
       )`,
      changedAt,
      id,
    );
    await transaction.runAsync(
      "UPDATE process_requirements SET document_id = NULL, is_confirmed = 0 WHERE document_id = ?",
      id,
    );
    await transaction.runAsync(
      "INSERT OR REPLACE INTO document_tombstones (document_id, deleted_at) VALUES (?, ?)",
      id,
      new Date().toISOString(),
    );
    await transaction.runAsync("DELETE FROM documents WHERE id = ?", id);
  });
}

export async function listDocumentTombstones(db: SQLiteDatabase) {
  await unlockDatabase(db);
  return db.getAllAsync<{ document_id: string; deleted_at: string }>(
    "SELECT document_id, deleted_at FROM document_tombstones",
  );
}

const QuickId = {
  create() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  },
};
