import type { SQLiteDatabase } from "expo-sqlite";

import type { DocumentKind } from "@/types/document";
import type {
  PaperworkRequirement,
  PaperworkRun,
  PaperworkTemplate,
} from "@/types/paperwork";

type RunRow = {
  id: string;
  template_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type RequirementRow = {
  id: string;
  run_id: string;
  label: string;
  accepted_kinds: string;
  document_id: string | null;
  position: number;
};

function quickId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function rowToRequirement(row: RequirementRow): PaperworkRequirement {
  return {
    id: row.id,
    label: row.label,
    acceptedKinds: JSON.parse(row.accepted_kinds) as DocumentKind[],
    documentId: row.document_id,
    position: row.position,
  };
}

export async function listPaperworkRuns(db: SQLiteDatabase): Promise<PaperworkRun[]> {
  const runs = await db.getAllAsync<RunRow>(
    "SELECT * FROM paperwork_runs ORDER BY updated_at DESC",
  );
  const requirements = await db.getAllAsync<RequirementRow>(
    "SELECT * FROM paperwork_requirements ORDER BY position ASC",
  );

  return runs.map((run) => ({
    id: run.id,
    templateId: run.template_id,
    title: run.title,
    requirements: requirements
      .filter((requirement) => requirement.run_id === run.id)
      .map(rowToRequirement),
    createdAt: run.created_at,
    updatedAt: run.updated_at,
  }));
}

export async function createPaperworkRun(db: SQLiteDatabase, template: PaperworkTemplate) {
  const id = quickId();
  const now = new Date().toISOString();

  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      "INSERT INTO paperwork_runs (id, template_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      id,
      template.id,
      template.title,
      now,
      now,
    );
    for (const [position, requirement] of template.requirements.entries()) {
      await transaction.runAsync(
        `INSERT INTO paperwork_requirements
          (id, run_id, label, accepted_kinds, document_id, position)
         VALUES (?, ?, ?, ?, NULL, ?)`,
        quickId(),
        id,
        requirement.label,
        JSON.stringify(requirement.acceptedKinds),
        position,
      );
    }
  });

  return id;
}

export async function linkRequirementDocument(
  db: SQLiteDatabase,
  runId: string,
  requirementId: string,
  documentId: string | null,
) {
  await db.withExclusiveTransactionAsync(async (transaction) => {
    if (documentId) {
      const match = await transaction.getFirstAsync<{
        accepted_kinds: string;
        kind: DocumentKind;
      }>(
        `SELECT requirement.accepted_kinds, document.kind
         FROM paperwork_requirements requirement
         JOIN documents document ON document.id = ?
         WHERE requirement.id = ? AND requirement.run_id = ?`,
        documentId,
        requirementId,
        runId,
      );
      const acceptedKinds = match
        ? (JSON.parse(match.accepted_kinds) as DocumentKind[])
        : [];
      if (!match || !acceptedKinds.includes(match.kind)) {
        throw new Error("This document type does not match the paperwork requirement.");
      }
    }
    await transaction.runAsync(
      "UPDATE paperwork_requirements SET document_id = ? WHERE id = ? AND run_id = ?",
      documentId,
      requirementId,
      runId,
    );
    await transaction.runAsync(
      "UPDATE paperwork_runs SET updated_at = ? WHERE id = ?",
      new Date().toISOString(),
      runId,
    );
  });
}

export async function removePaperworkRun(db: SQLiteDatabase, id: string) {
  await db.runAsync("DELETE FROM paperwork_runs WHERE id = ?", id);
}
