import type { DocumentKind, VaultDocument, VaultFolder } from "@/types/document";

export type GoogleDriveAccount = {
  id: string;
  email: string;
};

export type SyncStatus =
  | "signed-out"
  | "requires-pro"
  | "idle"
  | "syncing"
  | "account-mismatch"
  | "error";

export type DriveManifestDocument = Pick<
  VaultDocument,
  | "id"
  | "title"
  | "originalName"
  | "mimeType"
  | "fileExtension"
  | "fileSize"
  | "expiresAt"
  | "notes"
  | "isFavorite"
  | "createdAt"
  | "updatedAt"
  | "folderId"
> & {
  kind: DocumentKind;
  remoteFileId: string | null;
  deletedAt: string | null;
};

export type DriveManifestFolder = VaultFolder & {
  deletedAt: string | null;
};

export type DriveManifest = {
  schema: 2;
  folders: DriveManifestFolder[];
  documents: DriveManifestDocument[];
  updatedAt: string;
};

export type SyncReport = {
  uploaded: number;
  downloaded: number;
  deleted: number;
  lastSyncedAt: string;
};
