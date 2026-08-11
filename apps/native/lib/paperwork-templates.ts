import type { PaperworkTemplate } from "@/types/paperwork";

export const PAPERWORK_TEMPLATES: PaperworkTemplate[] = [
  {
    id: "passport-renewal",
    title: "Passport renewal",
    icon: "travel",
    requirements: [
      { label: "Current passport", acceptedKinds: ["travel", "identity"] },
      { label: "National identity document", acceptedKinds: ["identity"] },
      { label: "Portrait photograph", acceptedKinds: ["identity", "other"] },
      { label: "Application or appointment receipt", acceptedKinds: ["travel", "finance", "other"] },
    ],
  },
  {
    id: "rental-application",
    title: "Rental application",
    icon: "home",
    requirements: [
      { label: "Identity document", acceptedKinds: ["identity"] },
      { label: "Proof of income", acceptedKinds: ["finance", "work"] },
      { label: "Employment proof", acceptedKinds: ["work"] },
      { label: "Reference or prior rental record", acceptedKinds: ["home", "other"] },
    ],
  },
  {
    id: "emergency-folder",
    title: "Emergency folder",
    icon: "shield",
    requirements: [
      { label: "Household identity documents", acceptedKinds: ["identity"] },
      { label: "Health and medical records", acceptedKinds: ["health"] },
      { label: "Insurance records", acceptedKinds: ["finance", "health", "home"] },
      { label: "Property or vehicle records", acceptedKinds: ["home", "finance"] },
    ],
  },
];
