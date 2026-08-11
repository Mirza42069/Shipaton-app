import {
  GoogleSignin,
  isSuccessResponse,
  type User,
} from "@react-native-google-signin/google-signin";
import { useSQLiteContext } from "expo-sqlite";
import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import { Linking } from "react-native";

import { usePurchases } from "@/contexts/purchases-context";
import { useVault } from "@/contexts/vault-context";
import {
  DriveAccountMismatchError,
  syncDriveVault,
} from "@/lib/drive-sync";
import { DRIVE_SCOPES } from "@/lib/google-drive-client";
import type {
  GoogleDriveAccount,
  SyncReport,
  SyncStatus,
} from "@/types/sync";

type DriveSyncContextValue = {
  account: GoogleDriveAccount | null;
  status: SyncStatus;
  lastReport: SyncReport | null;
  error: string | null;
  connect: () => Promise<void>;
  syncNow: () => Promise<void>;
  disconnect: () => Promise<void>;
  openDriveFolder: () => Promise<void>;
};

const DriveSyncContext = createContext<DriveSyncContextValue | null>(null);

GoogleSignin.configure({
  scopes: [...DRIVE_SCOPES],
  offlineAccess: false,
});

function mapAccount(user: User): GoogleDriveAccount {
  return {
    id: user.user.id,
    email: user.user.email,
  };
}

export function DriveSyncProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const { isPro } = usePurchases();
  const { documents, refresh } = useVault();
  const [account, setAccount] = useState<GoogleDriveAccount | null>(null);
  const [status, setStatus] = useState<SyncStatus>(isPro ? "signed-out" : "requires-pro");
  const [lastReport, setLastReport] = useState<SyncReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const syncInFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!isPro) {
      setStatus("requires-pro");
      return;
    }
    if (account) {
      setStatus((current) => (current === "requires-pro" ? "idle" : current));
      return;
    }
    setStatus("signed-out");
  }, [account, isPro]);

  useEffect(() => {
    if (!GoogleSignin.hasPreviousSignIn()) return;
    void GoogleSignin.signInSilently()
      .then((response) => {
        if (response.type === "success") setAccount(mapAccount(response.data));
      })
      .catch(() => undefined);
  }, []);

  async function synchronize(activeAccount: GoogleDriveAccount) {
    if (syncInFlight.current) return syncInFlight.current;
    const operation = performSync(activeAccount);
    syncInFlight.current = operation;
    try {
      await operation;
    } finally {
      syncInFlight.current = null;
    }
  }

  async function performSync(activeAccount: GoogleDriveAccount) {
    if (!isPro) throw new Error("Berkas Pro is required for Drive sync.");
    setStatus("syncing");
    setError(null);
    try {
      const { accessToken } = await GoogleSignin.getTokens();
      const report = await syncDriveVault({
        db,
        accessToken,
        accountId: activeAccount.id,
        documents,
      });
      setLastReport(report);
      await refresh();
      setStatus("idle");
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "Drive sync failed.";
      setError(message);
      setStatus(syncError instanceof DriveAccountMismatchError ? "account-mismatch" : "error");
      throw syncError;
    }
  }

  async function connect() {
    if (!isPro) throw new Error("Subscribe to Berkas Pro before enabling Drive sync.");
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return;
    const nextAccount = mapAccount(response.data);
    setAccount(nextAccount);
    await synchronize(nextAccount);
  }

  async function syncNow() {
    if (!account) throw new Error("Connect a Google account first.");
    await synchronize(account);
  }

  async function disconnect() {
    await GoogleSignin.signOut();
    setAccount(null);
    setLastReport(null);
    setError(null);
    setStatus(isPro ? "signed-out" : "requires-pro");
  }

  async function openDriveFolder() {
    const state = await db.getFirstAsync<{ folder_id: string | null }>(
      "SELECT folder_id FROM drive_sync_state WHERE singleton_id = 1",
    );
    if (!state?.folder_id) throw new Error("Sync once before opening the Drive folder.");
    await Linking.openURL(`https://drive.google.com/drive/folders/${state.folder_id}`);
  }

  return (
    <DriveSyncContext
      value={{
        account,
        status,
        lastReport,
        error,
        connect,
        syncNow,
        disconnect,
        openDriveFolder,
      }}
    >
      {children}
    </DriveSyncContext>
  );
}

export function useDriveSync() {
  const context = use(DriveSyncContext);
  if (!context) throw new Error("useDriveSync must be used inside DriveSyncProvider");
  return context;
}
