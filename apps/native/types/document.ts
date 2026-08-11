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
  "title" | "kind" | "originalName" | "mimeType" | "fileExtension" | "expiresAt" | "notes"
> & {
  sourceUri: string;
};

export type DocumentKindDefinition = {
  value: DocumentKind;
  label: string;
  shortLabel: string;
  icon: string;
};

export const DOCUMENT_KIND_DEFINITIONS: DocumentKindDefinition[] = [
  { value: "identity", label: "Identity", shortLabel: "ID", icon: "finger-print-outline" },
  { value: "travel", label: "Travel", shortLabel: "TRAVEL", icon: "airplane-outline" },
  { value: "home", label: "Home", shortLabel: "HOME", icon: "home-outline" },
  { value: "finance", label: "Finance", shortLabel: "MONEY", icon: "wallet-outline" },
  { value: "health", label: "Health", shortLabel: "HEALTH", icon: "medical-outline" },
  { value: "education", label: "Education", shortLabel: "STUDY", icon: "school-outline" },
  { value: "work", label: "Work", shortLabel: "WORK", icon: "briefcase-outline" },
  { value: "other", label: "Other", shortLabel: "OTHER", icon: "document-outline" },
];
