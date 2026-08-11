import type { AppIconName } from "@/components/app-icon";
import type { DocumentKind } from "@/types/document";

export type PaperworkRequirement = {
  id: string;
  label: string;
  acceptedKinds: DocumentKind[];
  documentId: string | null;
  position: number;
};

export type PaperworkRun = {
  id: string;
  templateId: string;
  title: string;
  requirements: PaperworkRequirement[];
  createdAt: string;
  updatedAt: string;
};

export type PaperworkTemplate = {
  id: string;
  title: string;
  icon: AppIconName;
  requirements: Array<{
    label: string;
    acceptedKinds: DocumentKind[];
  }>;
};
