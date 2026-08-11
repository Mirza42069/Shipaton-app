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
    PRAGMA user_version = 1;
  `);
}
