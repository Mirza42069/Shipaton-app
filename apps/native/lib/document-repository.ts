import type { SQLiteDatabase } from "expo-sqlite";

import { encryptIntoVault } from "@/lib/vault-crypto";
import type { DocumentKind, NewVaultDocument, VaultDocument } from "@/types/document";

type DocumentRow = {
  id: string;
  title: string;
  kind: DocumentKind;
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

function rowToDocument(row: DocumentRow): VaultDocument {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
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
  const rows = await db.getAllAsync<DocumentRow>(
    "SELECT * FROM documents ORDER BY is_favorite DESC, updated_at DESC",
  );
  return rows.map(rowToDocument);
}

export async function getDocument(db: SQLiteDatabase, id: string) {
  const row = await db.getFirstAsync<DocumentRow>("SELECT * FROM documents WHERE id = ?", id);
  return row ? rowToDocument(row) : null;
}

export async function createDocument(
  db: SQLiteDatabase,
  input: NewVaultDocument,
  notificationId: string | null,
) {
  const id = QuickId.create();
  const now = new Date().toISOString();
  const encrypted = await encryptIntoVault(input.sourceUri, id);

  await db.runAsync(
    `INSERT INTO documents (
      id, title, kind, encrypted_uri, original_name, mime_type, file_extension,
      file_size, expires_at, notes, is_favorite, notification_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    id,
    input.title.trim(),
    input.kind,
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

  return id;
}

export async function setFavorite(db: SQLiteDatabase, id: string, isFavorite: boolean) {
  await db.runAsync(
    "UPDATE documents SET is_favorite = ?, updated_at = ? WHERE id = ?",
    isFavorite ? 1 : 0,
    new Date().toISOString(),
    id,
  );
}

export async function removeDocument(db: SQLiteDatabase, id: string) {
  await db.runAsync("DELETE FROM documents WHERE id = ?", id);
}

const QuickId = {
  create() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  },
};
