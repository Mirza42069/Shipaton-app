import { useSQLiteContext } from "expo-sqlite";
import { createContext, type PropsWithChildren, use, useEffect, useState } from "react";

import { useVault } from "@/contexts/vault-context";
import {
  addProcessRequirement,
  archiveProcess,
  confirmProcessRequirement,
  createCustomProcess,
  createProcessFromTemplate,
  linkProcessDocument,
  listProcesses,
  moveProcessRequirement,
  removeProcess,
  removeProcessRequirement,
  renameProcess,
  renameProcessRequirement,
  restoreProcess,
} from "@/lib/process-repository";
import type { ProcessTemplate, VaultProcess } from "@/types/process";

type ProcessContextValue = {
  processes: VaultProcess[];
  isLoading: boolean;
  startTemplate: (template: ProcessTemplate) => Promise<string>;
  createCustom: (title: string, requirements: string[]) => Promise<string>;
  rename: (id: string, title: string) => Promise<void>;
  addRequirement: (processId: string, label: string) => Promise<void>;
  renameRequirement: (processId: string, requirementId: string, label: string) => Promise<void>;
  moveRequirement: (processId: string, requirementId: string, direction: -1 | 1) => Promise<void>;
  deleteRequirement: (processId: string, requirementId: string) => Promise<void>;
  linkDocument: (processId: string, requirementId: string, documentId: string | null) => Promise<void>;
  setConfirmed: (processId: string, requirementId: string, confirmed: boolean) => Promise<void>;
  archive: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  deleteProcess: (id: string) => Promise<void>;
};

const ProcessContext = createContext<ProcessContextValue | null>(null);

export function ProcessProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const { documents } = useVault();
  const [processes, setProcesses] = useState<VaultProcess[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    try {
      setProcesses(await listProcesses(db));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [db, documents]);

  async function mutate(operation: () => Promise<void>) {
    await operation();
    await refresh();
  }

  async function startTemplate(template: ProcessTemplate) {
    const id = await createProcessFromTemplate(db, template);
    await refresh();
    return id;
  }

  async function createCustom(title: string, requirements: string[]) {
    const id = await createCustomProcess(db, title, requirements);
    await refresh();
    return id;
  }

  return (
    <ProcessContext
      value={{
        processes,
        isLoading,
        startTemplate,
        createCustom,
        rename: (id, title) => mutate(() => renameProcess(db, id, title)),
        addRequirement: (processId, label) => mutate(() => addProcessRequirement(db, processId, label)),
        renameRequirement: (processId, requirementId, label) =>
          mutate(() => renameProcessRequirement(db, processId, requirementId, label)),
        moveRequirement: (processId, requirementId, direction) =>
          mutate(() => moveProcessRequirement(db, processId, requirementId, direction)),
        deleteRequirement: (processId, requirementId) =>
          mutate(() => removeProcessRequirement(db, processId, requirementId)),
        linkDocument: (processId, requirementId, documentId) =>
          mutate(() => linkProcessDocument(db, processId, requirementId, documentId)),
        setConfirmed: (processId, requirementId, confirmed) =>
          mutate(() => confirmProcessRequirement(db, processId, requirementId, confirmed)),
        archive: (id) => mutate(() => archiveProcess(db, id)),
        restore: (id) => mutate(() => restoreProcess(db, id)),
        deleteProcess: (id) => mutate(() => removeProcess(db, id)),
      }}
    >
      {children}
    </ProcessContext>
  );
}

export function useProcesses() {
  const context = use(ProcessContext);
  if (!context) throw new Error("useProcesses must be used inside ProcessProvider");
  return context;
}
