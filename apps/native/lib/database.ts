import type { SQLiteDatabase } from "expo-sqlite";

import { getVaultKeyHex } from "@/lib/vault-key";

export async function initializeDatabase(db: SQLiteDatabase) {
  const key = await getVaultKeyHex();

  await db.execAsync(`
    PRAGMA key = "x'${key}'";
    PRAGMA cipher_memory_security = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      kind TEXT NOT NULL,
      encrypted_uri TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_extension TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      expires_at TEXT,
      notes TEXT NOT NULL DEFAULT '',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      notification_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS documents_title_index ON documents(title);
    CREATE INDEX IF NOT EXISTS documents_expiry_index ON documents(expires_at);

    CREATE TABLE IF NOT EXISTS paperwork_runs (
      id TEXT PRIMARY KEY NOT NULL,
      template_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS paperwork_requirements (
      id TEXT PRIMARY KEY NOT NULL,
      run_id TEXT NOT NULL,
      label TEXT NOT NULL,
      accepted_kinds TEXT NOT NULL,
      document_id TEXT,
      position INTEGER NOT NULL,
      FOREIGN KEY (run_id) REFERENCES paperwork_runs(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS paperwork_requirements_run_index
      ON paperwork_requirements(run_id, position);

    CREATE TABLE IF NOT EXISTS document_tombstones (
      document_id TEXT PRIMARY KEY NOT NULL,
      deleted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS drive_sync_state (
      singleton_id INTEGER PRIMARY KEY NOT NULL CHECK (singleton_id = 1),
      google_account_id TEXT NOT NULL,
      folder_id TEXT,
      manifest_file_id TEXT,
      last_synced_at TEXT
    );

    PRAGMA user_version = 3;
  `);
}
