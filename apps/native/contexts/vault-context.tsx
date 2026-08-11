import { useSQLiteContext } from "expo-sqlite";
import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
  useState,
} from "react";

import {
  createDocument,
  getDocument,
  listDocuments,
  removeDocument,
  setFavorite,
} from "@/lib/document-repository";
import { cancelExpiryReminder, scheduleExpiryReminder } from "@/lib/notifications";
import { deleteVaultFile } from "@/lib/vault-crypto";
import type { NewVaultDocument, VaultDocument } from "@/types/document";

type VaultContextValue = {
  documents: VaultDocument[];
  isLoading: boolean;
  addDocument: (input: NewVaultDocument) => Promise<string>;
  deleteDocument: (id: string) => Promise<void>;
  toggleFavorite: (id: string, currentValue: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    setDocuments(await listDocuments(db));
    setIsLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, [db]);

  async function addDocument(input: NewVaultDocument) {
    const notificationId = await scheduleExpiryReminder(input.title, input.expiresAt);
    try {
      const id = await createDocument(db, input, notificationId);
      await refresh();
      return id;
    } catch (error) {
      await cancelExpiryReminder(notificationId);
      throw error;
    }
  }

  async function deleteDocumentById(id: string) {
    const document = await getDocument(db, id);
    if (!document) return;

    await removeDocument(db, id);
    deleteVaultFile(document.encryptedUri);
    await cancelExpiryReminder(document.notificationId);
    await refresh();
  }

  async function toggleFavorite(id: string, currentValue: boolean) {
    await setFavorite(db, id, !currentValue);
    await refresh();
  }

  return (
    <VaultContext
      value={{
        documents,
        isLoading,
        addDocument,
        deleteDocument: deleteDocumentById,
        toggleFavorite,
        refresh,
      }}
    >
      {children}
    </VaultContext>
  );
}

export function useVault() {
  const context = use(VaultContext);
  if (!context) throw new Error("useVault must be used inside VaultProvider");
  return context;
}
