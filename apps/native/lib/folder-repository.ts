import type { SQLiteDatabase } from "expo-sqlite";

import { unlockDatabase } from "@/lib/database";
import type { VaultFolder } from "@/types/document";

type FolderRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

function toFolder(row: FolderRow): VaultFolder {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validName(name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80) throw new Error("Folder names must be between 1 and 80 characters.");
  return trimmed;
}

export async function listFolders(db: SQLiteDatabase) {
  await unlockDatabase(db);
  const rows = await db.getAllAsync<FolderRow>("SELECT * FROM folders ORDER BY name COLLATE NOCASE");
  return rows.map(toFolder);
}

export async function createFolder(db: SQLiteDatabase, name: string) {
  await unlockDatabase(db);
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    "INSERT INTO folders (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
    id,
    validName(name),
    now,
    now,
  );
  return id;
}

export async function renameFolder(db: SQLiteDatabase, id: string, name: string) {
  await unlockDatabase(db);
  await db.runAsync(
    "UPDATE folders SET name = ?, updated_at = ? WHERE id = ?",
    validName(name),
    new Date().toISOString(),
    id,
  );
}

export async function removeFolder(db: SQLiteDatabase, id: string) {
  await unlockDatabase(db);
  const deletedAt = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await transaction.runAsync(
      "INSERT OR REPLACE INTO folder_tombstones (folder_id, deleted_at) VALUES (?, ?)",
      id,
      deletedAt,
    );
    await transaction.runAsync(
      "UPDATE documents SET folder_id = NULL, updated_at = ? WHERE folder_id = ?",
      deletedAt,
      id,
    );
    await transaction.runAsync("DELETE FROM folders WHERE id = ?", id);
  });
}

export async function listFolderTombstones(db: SQLiteDatabase) {
  await unlockDatabase(db);
  return db.getAllAsync<{ folder_id: string; deleted_at: string }>(
    "SELECT folder_id, deleted_at FROM folder_tombstones",
  );
}

export async function importSyncedFolder(db: SQLiteDatabase, folder: VaultFolder) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await transaction.runAsync(
      `INSERT OR IGNORE INTO folders (id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      folder.id,
      validName(folder.name),
      folder.createdAt,
      folder.updatedAt,
    );
    await transaction.runAsync("DELETE FROM folder_tombstones WHERE folder_id = ?", folder.id);
  });
}

export async function applySyncedFolderMetadata(db: SQLiteDatabase, folder: VaultFolder) {
  await unlockDatabase(db);
  await db.runAsync(
    "UPDATE folders SET name = ?, updated_at = ? WHERE id = ?",
    validName(folder.name),
    folder.updatedAt,
    folder.id,
  );
}

export async function applySyncedFolderDeletion(db: SQLiteDatabase, id: string, deletedAt: string) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await transaction.runAsync(
      "INSERT OR REPLACE INTO folder_tombstones (folder_id, deleted_at) VALUES (?, ?)",
      id,
      deletedAt,
    );
    await transaction.runAsync(
      "UPDATE documents SET folder_id = NULL, updated_at = ? WHERE folder_id = ?",
      deletedAt,
      id,
    );
    await transaction.runAsync("DELETE FROM folders WHERE id = ?", id);
  });
}
