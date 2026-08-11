import { useSQLiteContext } from "expo-sqlite";
import { createContext, type PropsWithChildren, use, useEffect, useState } from "react";

import { useVault } from "@/contexts/vault-context";
import {
  createPaperworkRun,
  linkRequirementDocument,
  listPaperworkRuns,
  removePaperworkRun,
} from "@/lib/paperwork-repository";
import type { PaperworkRun, PaperworkTemplate } from "@/types/paperwork";

type PaperworkContextValue = {
  runs: PaperworkRun[];
  isLoading: boolean;
  startRun: (template: PaperworkTemplate) => Promise<string>;
  linkDocument: (runId: string, requirementId: string, documentId: string | null) => Promise<void>;
  deleteRun: (id: string) => Promise<void>;
};

const PaperworkContext = createContext<PaperworkContextValue | null>(null);

export function PaperworkProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const { documents } = useVault();
  const [runs, setRuns] = useState<PaperworkRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    setRuns(await listPaperworkRuns(db));
    setIsLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, [db, documents]);

  async function startRun(template: PaperworkTemplate) {
    const id = await createPaperworkRun(db, template);
    await refresh();
    return id;
  }

  async function linkDocument(runId: string, requirementId: string, documentId: string | null) {
    await linkRequirementDocument(db, runId, requirementId, documentId);
    await refresh();
  }

  async function deleteRun(id: string) {
    await removePaperworkRun(db, id);
    await refresh();
  }

  return (
    <PaperworkContext value={{ runs, isLoading, startRun, linkDocument, deleteRun }}>
      {children}
    </PaperworkContext>
  );
}

export function usePaperwork() {
  const context = use(PaperworkContext);
  if (!context) throw new Error("usePaperwork must be used inside PaperworkProvider");
  return context;
}
