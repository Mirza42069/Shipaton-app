const DAY_IN_MS = 24 * 60 * 60 * 1000;

function calendarParts(dateString: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

function calendarDayNumber(dateString: string) {
  const parts = calendarParts(dateString);
  if (!parts) return null;
  const { year, month, day } = parts;
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS);
}

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function daysUntil(dateString: string, now = startOfToday()) {
  const date = calendarDayNumber(dateString);
  const today = calendarDayNumber(formatLocalDate(now));
  if (date === null || today === null) return Number.POSITIVE_INFINITY;
  return date - today;
}

export function formatDate(dateString: string) {
  const parts = calendarParts(dateString);
  if (!parts) return "Invalid date";
  const { year, month, day } = parts;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function expiryLabel(dateString: string | null) {
  if (!dateString) return { label: "No expiry", tone: "neutral" as const };
  if (!calendarParts(dateString)) return { label: "Invalid expiry date", tone: "neutral" as const };

  const days = daysUntil(dateString);
  if (days === -1) return { label: "Expired yesterday", tone: "danger" as const };
  if (days < 0) return { label: `Expired ${Math.abs(days)} days ago`, tone: "danger" as const };
  if (days === 0) return { label: "Expires today", tone: "danger" as const };
  if (days === 1) return { label: "1 day left", tone: "danger" as const };
  if (days <= 30) return { label: `${days} days left`, tone: "danger" as const };
  if (days <= 90) return { label: `${days} days left`, tone: "warning" as const };
  return { label: formatDate(dateString), tone: "neutral" as const };
}
