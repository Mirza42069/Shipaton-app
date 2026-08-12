import type { ProcessTemplate } from "@/types/process";

export const PROCESS_TEMPLATES: ProcessTemplate[] = [
  {
    id: "visa-renewal",
    title: "Visa renewal",
    detail: "Gather identity, application, appointment, and payment proof.",
    icon: "travel",
    requirements: [
      { label: "Valid passport", recommendedKinds: ["travel", "identity"] },
      { label: "Recent portrait photograph", recommendedKinds: ["identity", "other"] },
      { label: "Completed visa application", recommendedKinds: ["travel", "other"] },
      { label: "Supporting eligibility document", recommendedKinds: ["work", "education", "finance", "other"] },
      { label: "Appointment confirmation", recommendedKinds: ["travel", "other"] },
      { label: "Payment receipt", recommendedKinds: ["finance", "travel"] },
    ],
  },
  {
    id: "passport-renewal",
    title: "Passport renewal",
    detail: "Prepare the proof needed for a passport renewal appointment.",
    icon: "document-security",
    requirements: [
      { label: "Current passport", recommendedKinds: ["travel", "identity"] },
      { label: "National identity document", recommendedKinds: ["identity"] },
      { label: "Recent portrait photograph", recommendedKinds: ["identity", "other"] },
      { label: "Completed renewal application", recommendedKinds: ["travel", "other"] },
      { label: "Payment receipt", recommendedKinds: ["finance", "travel"] },
    ],
  },
];
