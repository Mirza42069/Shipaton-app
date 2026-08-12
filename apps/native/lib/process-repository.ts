import type { SQLiteDatabase } from "expo-sqlite";

import { unlockDatabase } from "@/lib/database";
import type { DocumentKind } from "@/types/document";
import type { ProcessRequirement, ProcessTemplate, VaultProcess } from "@/types/process";

type ProcessRow = {
  id: string;
  template_id: string | null;
  title: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type RequirementRow = {
  id: string;
  process_id: string;
  label: string;
  recommended_kinds: string;
  document_id: string | null;
  is_confirmed: number;
  position: number;
};

function quickId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function validTitle(value: string, noun: "Process" | "Requirement") {
  const title = value.trim();
  if (!title || title.length > 100) throw new Error(`${noun} names must be between 1 and 100 characters.`);
  return title;
}

function toRequirement(row: RequirementRow): ProcessRequirement {
  return {
    id: row.id,
    label: row.label,
    recommendedKinds: JSON.parse(row.recommended_kinds) as DocumentKind[],
    documentId: row.document_id,
    isConfirmed: row.is_confirmed === 1,
    position: row.position,
  };
}

async function assertEditableProcess(db: SQLiteDatabase, id: string) {
  const process = await db.getFirstAsync<{ archived_at: string | null }>(
    "SELECT archived_at FROM processes WHERE id = ?",
    id,
  );
  if (!process) throw new Error("This process is no longer available.");
  if (process.archived_at) throw new Error("Restore this process before changing it.");
}

export async function listProcesses(db: SQLiteDatabase): Promise<VaultProcess[]> {
  await unlockDatabase(db);
  const [processes, requirements] = await Promise.all([
    db.getAllAsync<ProcessRow>(
      "SELECT * FROM processes ORDER BY archived_at IS NOT NULL, updated_at DESC",
    ),
    db.getAllAsync<RequirementRow>(
      "SELECT * FROM process_requirements ORDER BY process_id, position",
    ),
  ]);
  const byProcess = new Map<string, ProcessRequirement[]>();
  for (const row of requirements) {
    const items = byProcess.get(row.process_id) ?? [];
    items.push(toRequirement(row));
    byProcess.set(row.process_id, items);
  }
  return processes.map((row) => ({
    id: row.id,
    templateId: row.template_id,
    title: row.title,
    requirements: byProcess.get(row.id) ?? [],
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createProcessFromTemplate(db: SQLiteDatabase, template: ProcessTemplate) {
  return createProcess(db, template.title, template.requirements, template.id);
}

export async function createCustomProcess(db: SQLiteDatabase, title: string, labels: string[]) {
  return createProcess(
    db,
    title,
    labels.map((label) => ({ label, recommendedKinds: [] })),
    null,
  );
}

async function createProcess(
  db: SQLiteDatabase,
  title: string,
  requirements: Array<{ label: string; recommendedKinds: DocumentKind[] }>,
  templateId: string | null,
) {
  await unlockDatabase(db);
  if (!requirements.length) throw new Error("Add at least one requirement.");
  const id = quickId();
  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await transaction.runAsync(
      `INSERT INTO processes (id, template_id, title, archived_at, created_at, updated_at)
       VALUES (?, ?, ?, NULL, ?, ?)`,
      id,
      templateId,
      validTitle(title, "Process"),
      now,
      now,
    );
    for (const [position, requirement] of requirements.entries()) {
      await transaction.runAsync(
        `INSERT INTO process_requirements
          (id, process_id, label, recommended_kinds, document_id, is_confirmed, position)
         VALUES (?, ?, ?, ?, NULL, 0, ?)`,
        quickId(),
        id,
        validTitle(requirement.label, "Requirement"),
        JSON.stringify(requirement.recommendedKinds),
        position,
      );
    }
  });
  return id;
}

async function touchProcess(db: SQLiteDatabase, id: string) {
  await db.runAsync("UPDATE processes SET updated_at = ? WHERE id = ?", new Date().toISOString(), id);
}

export async function renameProcess(db: SQLiteDatabase, id: string, title: string) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await assertEditableProcess(transaction, id);
    await transaction.runAsync(
      "UPDATE processes SET title = ?, updated_at = ? WHERE id = ?",
      validTitle(title, "Process"),
      new Date().toISOString(),
      id,
    );
  });
}

export async function addProcessRequirement(db: SQLiteDatabase, processId: string, label: string) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await assertEditableProcess(transaction, processId);
    const position = await transaction.getFirstAsync<{ next_position: number }>(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM process_requirements WHERE process_id = ?",
      processId,
    );
    await transaction.runAsync(
      `INSERT INTO process_requirements
        (id, process_id, label, recommended_kinds, document_id, is_confirmed, position)
       VALUES (?, ?, ?, '[]', NULL, 0, ?)`,
      quickId(),
      processId,
      validTitle(label, "Requirement"),
      position?.next_position ?? 0,
    );
    await touchProcess(transaction, processId);
  });
}

export async function renameProcessRequirement(
  db: SQLiteDatabase,
  processId: string,
  requirementId: string,
  label: string,
) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await assertEditableProcess(transaction, processId);
    const result = await transaction.runAsync(
      "UPDATE process_requirements SET label = ? WHERE id = ? AND process_id = ?",
      validTitle(label, "Requirement"),
      requirementId,
      processId,
    );
    if (!result.changes) throw new Error("This requirement is no longer available.");
    await touchProcess(transaction, processId);
  });
}

export async function moveProcessRequirement(
  db: SQLiteDatabase,
  processId: string,
  requirementId: string,
  direction: -1 | 1,
) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await assertEditableProcess(transaction, processId);
    const current = await transaction.getFirstAsync<{ position: number }>(
      "SELECT position FROM process_requirements WHERE id = ? AND process_id = ?",
      requirementId,
      processId,
    );
    if (!current) return;
    const target = await transaction.getFirstAsync<{ id: string; position: number }>(
      `SELECT id, position FROM process_requirements
       WHERE process_id = ? AND position ${direction < 0 ? "<" : ">"} ?
       ORDER BY position ${direction < 0 ? "DESC" : "ASC"} LIMIT 1`,
      processId,
      current.position,
    );
    if (!target) return;
    await transaction.runAsync("UPDATE process_requirements SET position = -1 WHERE id = ?", requirementId);
    await transaction.runAsync("UPDATE process_requirements SET position = ? WHERE id = ?", current.position, target.id);
    await transaction.runAsync("UPDATE process_requirements SET position = ? WHERE id = ?", target.position, requirementId);
    await touchProcess(transaction, processId);
  });
}

export async function removeProcessRequirement(
  db: SQLiteDatabase,
  processId: string,
  requirementId: string,
) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await assertEditableProcess(transaction, processId);
    const count = await transaction.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM process_requirements WHERE process_id = ?",
      processId,
    );
    if ((count?.count ?? 0) <= 1) throw new Error("A process needs at least one requirement.");
    const result = await transaction.runAsync(
      "DELETE FROM process_requirements WHERE id = ? AND process_id = ?",
      requirementId,
      processId,
    );
    if (!result.changes) throw new Error("This requirement is no longer available.");
    const rows = await transaction.getAllAsync<{ id: string }>(
      "SELECT id FROM process_requirements WHERE process_id = ? ORDER BY position",
      processId,
    );
    for (const [position, row] of rows.entries()) {
      await transaction.runAsync("UPDATE process_requirements SET position = ? WHERE id = ?", position, row.id);
    }
    await touchProcess(transaction, processId);
  });
}

export async function linkProcessDocument(
  db: SQLiteDatabase,
  processId: string,
  requirementId: string,
  documentId: string | null,
) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await assertEditableProcess(transaction, processId);
    const requirement = await transaction.getFirstAsync<{ id: string }>(
      "SELECT id FROM process_requirements WHERE id = ? AND process_id = ?",
      requirementId,
      processId,
    );
    if (!requirement) throw new Error("This requirement is no longer available.");
    if (documentId) {
      const document = await transaction.getFirstAsync<{ id: string }>(
        "SELECT id FROM documents WHERE id = ?",
        documentId,
      );
      if (!document) throw new Error("That vault document is no longer available.");
    }
    const result = await transaction.runAsync(
      `UPDATE process_requirements
       SET document_id = ?, is_confirmed = CASE WHEN document_id IS ? THEN is_confirmed ELSE 0 END
       WHERE id = ? AND process_id = ?`,
      documentId,
      documentId,
      requirementId,
      processId,
    );
    if (!result.changes) throw new Error("This requirement is no longer available.");
    await touchProcess(transaction, processId);
  });
}

export async function confirmProcessRequirement(
  db: SQLiteDatabase,
  processId: string,
  requirementId: string,
  confirmed: boolean,
) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await assertEditableProcess(transaction, processId);
    const requirement = await transaction.getFirstAsync<{ document_id: string | null }>(
      "SELECT document_id FROM process_requirements WHERE id = ? AND process_id = ?",
      requirementId,
      processId,
    );
    if (!requirement) throw new Error("This requirement is no longer available.");
    if (confirmed && !requirement.document_id) throw new Error("Link a vault document before confirming this requirement.");
    const result = await transaction.runAsync(
      "UPDATE process_requirements SET is_confirmed = ? WHERE id = ? AND process_id = ?",
      confirmed ? 1 : 0,
      requirementId,
      processId,
    );
    if (!result.changes) throw new Error("This requirement is no longer available.");
    await touchProcess(transaction, processId);
  });
}

export async function archiveProcess(db: SQLiteDatabase, id: string) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await assertEditableProcess(transaction, id);
    const incomplete = await transaction.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM process_requirements
       WHERE process_id = ? AND (document_id IS NULL OR is_confirmed = 0)`,
      id,
    );
    if ((incomplete?.count ?? 0) > 0) throw new Error("Complete every requirement before archiving this process.");
    const now = new Date().toISOString();
    await transaction.runAsync("UPDATE processes SET archived_at = ?, updated_at = ? WHERE id = ?", now, now, id);
  });
}

export async function restoreProcess(db: SQLiteDatabase, id: string) {
  await unlockDatabase(db);
  await db.runAsync(
    "UPDATE processes SET archived_at = NULL, updated_at = ? WHERE id = ?",
    new Date().toISOString(),
    id,
  );
}

export async function removeProcess(db: SQLiteDatabase, id: string) {
  await unlockDatabase(db);
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await unlockDatabase(transaction);
    await transaction.runAsync("DELETE FROM process_requirements WHERE process_id = ?", id);
    const result = await transaction.runAsync("DELETE FROM processes WHERE id = ?", id);
    if (!result.changes) throw new Error("This process is no longer available.");
  });
}
