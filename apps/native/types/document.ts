import type { AppIconName } from "@/components/app-icon";

export const DOCUMENT_KINDS = [
  "identity",
  "travel",
  "home",
  "finance",
  "health",
  "education",
  "work",
  "other",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export type VaultDocument = {
  id: string;
  title: string;
  kind: DocumentKind;
  folderId: string | null;
  encryptedUri: string;
  originalName: string;
  mimeType: string;
  fileExtension: string;
  fileSize: number;
  expiresAt: string | null;
  notes: string;
  isFavorite: boolean;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewVaultDocument = Pick<
  VaultDocument,
  "title" | "kind" | "folderId" | "originalName" | "mimeType" | "fileExtension" | "expiresAt" | "notes"
> & {
  sourceUri: string;
};

export type VaultFolder = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentKindDefinition = {
  value: DocumentKind;
  label: string;
  shortLabel: string;
  icon: AppIconName;
};

export const DOCUMENT_KIND_DEFINITIONS: DocumentKindDefinition[] = [
  { value: "identity", label: "Identity", shortLabel: "ID", icon: "biometric" },
  { value: "travel", label: "Travel", shortLabel: "TRAVEL", icon: "travel" },
  { value: "home", label: "Home", shortLabel: "HOME", icon: "home" },
  { value: "finance", label: "Finance", shortLabel: "MONEY", icon: "wallet" },
  { value: "health", label: "Health", shortLabel: "HEALTH", icon: "health" },
  { value: "education", label: "Education", shortLabel: "STUDY", icon: "education" },
  { value: "work", label: "Work", shortLabel: "WORK", icon: "work" },
  { value: "other", label: "Other", shortLabel: "OTHER", icon: "other" },
];

export function normalizeDocumentKind(value: string): DocumentKind {
  return DOCUMENT_KINDS.find((kind) => kind === value) ?? "other";
}

export function getDocumentKindDefinition(value: string) {
  const normalized = normalizeDocumentKind(value);
  return DOCUMENT_KIND_DEFINITIONS.find((item) => item.value === normalized)!;
}
