import type { SQLiteDatabase } from "expo-sqlite";

import { getVaultKeyHex } from "@/lib/vault-key";

export async function unlockDatabase(db: SQLiteDatabase) {
  const key = await getVaultKeyHex();
  await db.execAsync(`PRAGMA key = "x'${key}'"; PRAGMA foreign_keys = ON;`);
}

export async function initializeDatabase(db: SQLiteDatabase) {
  await unlockDatabase(db);
  await db.execAsync(`
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

  `);

  const version = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const legacyPaperwork = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'paperwork_runs'",
  );
  if ((version?.user_version ?? 0) < 4) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        PRAGMA user_version = 4;
      `);
    });
  }

  if ((version?.user_version ?? 0) < 5) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS folders (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS folder_tombstones (
          folder_id TEXT PRIMARY KEY NOT NULL,
          deleted_at TEXT NOT NULL
        );

        ALTER TABLE documents
          ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL;

        CREATE INDEX IF NOT EXISTS documents_folder_index ON documents(folder_id);
        CREATE INDEX IF NOT EXISTS folders_name_index ON folders(name);
        PRAGMA user_version = 5;
      `);
    });
  }

  if ((version?.user_version ?? 0) < 6) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS processes (
          id TEXT PRIMARY KEY NOT NULL,
          template_id TEXT,
          title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 100),
          archived_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS process_requirements (
          id TEXT PRIMARY KEY NOT NULL,
          process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
          label TEXT NOT NULL CHECK(length(trim(label)) BETWEEN 1 AND 100),
          recommended_kinds TEXT NOT NULL DEFAULT '[]',
          document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
          is_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(is_confirmed IN (0, 1)),
          position INTEGER NOT NULL,
          UNIQUE(process_id, position)
        );

        CREATE INDEX IF NOT EXISTS process_requirements_process_index
          ON process_requirements(process_id, position);
        CREATE INDEX IF NOT EXISTS process_requirements_document_index
          ON process_requirements(document_id);
        CREATE TRIGGER IF NOT EXISTS process_document_unlinked
          AFTER UPDATE OF document_id ON process_requirements
          WHEN NEW.document_id IS NULL AND OLD.document_id IS NOT NULL
          BEGIN
            UPDATE process_requirements SET is_confirmed = 0 WHERE id = NEW.id;
          END;
        PRAGMA user_version = 6;
      `);
      if (legacyPaperwork) {
        await db.execAsync(`
          INSERT OR IGNORE INTO processes
            (id, template_id, title, archived_at, created_at, updated_at)
          SELECT id, template_id, title, NULL, created_at, updated_at FROM paperwork_runs;

          INSERT OR IGNORE INTO process_requirements
            (id, process_id, label, recommended_kinds, document_id, is_confirmed, position)
          SELECT requirement.id, requirement.run_id, requirement.label,
            requirement.accepted_kinds,
            CASE WHEN document.id IS NULL THEN NULL ELSE requirement.document_id END,
            0,
            requirement.position
          FROM paperwork_requirements requirement
          LEFT JOIN documents document ON document.id = requirement.document_id;

          DROP TABLE paperwork_requirements;
          DROP TABLE paperwork_runs;
        `);
      }
    });
  }

}
