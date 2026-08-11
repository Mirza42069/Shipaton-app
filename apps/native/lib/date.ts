const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function daysUntil(dateString: string, now = startOfToday()) {
  const date = new Date(`${dateString}T00:00:00`);
  return Math.ceil((date.getTime() - now.getTime()) / DAY_IN_MS);
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function expiryLabel(dateString: string | null) {
  if (!dateString) return { label: "No expiry", tone: "neutral" as const };

  const days = daysUntil(dateString);
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, tone: "danger" as const };
  if (days === 0) return { label: "Expires today", tone: "danger" as const };
  if (days <= 30) return { label: `${days} days left`, tone: "danger" as const };
  if (days <= 90) return { label: `${days} days left`, tone: "warning" as const };
  return { label: formatDate(dateString), tone: "neutral" as const };
}
