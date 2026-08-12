import type { AppIconName } from "@/components/app-icon";
import type { DocumentKind } from "@/types/document";

export type ProcessRequirement = {
  id: string;
  label: string;
  recommendedKinds: DocumentKind[];
  documentId: string | null;
  isConfirmed: boolean;
  position: number;
};

export type VaultProcess = {
  id: string;
  templateId: string | null;
  title: string;
  requirements: ProcessRequirement[];
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProcessTemplate = {
  id: string;
  title: string;
  detail: string;
  icon: AppIconName;
  requirements: Array<{
    label: string;
    recommendedKinds: DocumentKind[];
  }>;
};

export function isRequirementReady(requirement: ProcessRequirement) {
  return Boolean(requirement.documentId && requirement.isConfirmed);
}

export function processProgress(process: VaultProcess) {
  const ready = process.requirements.filter(isRequirementReady).length;
  return {
    ready,
    total: process.requirements.length,
    ratio: process.requirements.length ? ready / process.requirements.length : 0,
  };
}
