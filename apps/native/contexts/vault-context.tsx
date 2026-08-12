import { useSQLiteContext } from "expo-sqlite";
import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
  useState,
} from "react";

import { usePurchases } from "@/contexts/purchases-context";
import {
  createDocument,
  getDocument,
  listDocuments,
  removeDocument,
  setFavorite,
  setDocumentFolder,
} from "@/lib/document-repository";
import {
  createFolder,
  listFolders,
  removeFolder,
  renameFolder,
} from "@/lib/folder-repository";
import { cancelExpiryReminder, scheduleExpiryReminder } from "@/lib/notifications";
import { deletePreviewFile, deleteVaultFile } from "@/lib/vault-crypto";
import type { NewVaultDocument, VaultDocument, VaultFolder } from "@/types/document";

type VaultContextValue = {
  documents: VaultDocument[];
  folders: VaultFolder[];
  isLoading: boolean;
  addDocument: (input: NewVaultDocument) => Promise<string>;
  deleteDocument: (id: string) => Promise<void>;
  toggleFavorite: (id: string, currentValue: boolean) => Promise<void>;
  addFolder: (name: string) => Promise<string>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  moveDocument: (id: string, folderId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const { isPro } = usePurchases();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    const [nextDocuments, nextFolders] = await Promise.all([listDocuments(db), listFolders(db)]);
    setDocuments(nextDocuments);
    setFolders(nextFolders);
    setIsLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, [db]);

  async function addDocument(input: NewVaultDocument) {
    const notificationId = await scheduleExpiryReminder(input.title, input.expiresAt);
    try {
      const id = await createDocument(db, input, notificationId, isPro);
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
    deletePreviewFile(document.id, document.fileExtension);
    await cancelExpiryReminder(document.notificationId);
    await refresh();
  }

  async function toggleFavorite(id: string, currentValue: boolean) {
    await setFavorite(db, id, !currentValue);
    await refresh();
  }

  async function addFolder(name: string) {
    const id = await createFolder(db, name);
    await refresh();
    return id;
  }

  async function updateFolderName(id: string, name: string) {
    await renameFolder(db, id, name);
    await refresh();
  }

  async function deleteFolderById(id: string) {
    await removeFolder(db, id);
    await refresh();
  }

  async function moveDocument(id: string, folderId: string | null) {
    await setDocumentFolder(db, id, folderId);
    await refresh();
  }

  return (
    <VaultContext
      value={{
        documents,
        folders,
        isLoading,
        addDocument,
        deleteDocument: deleteDocumentById,
        toggleFavorite,
        addFolder,
        renameFolder: updateFolderName,
        deleteFolder: deleteFolderById,
        moveDocument,
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
