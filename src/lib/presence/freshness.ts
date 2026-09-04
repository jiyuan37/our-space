function localDateKey(value: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

export function isPresenceCurrentForViewer(
  updatedAt: string | Date,
  now: Date = new Date(),
  timeZone?: string,
): boolean {
  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime()) || Number.isNaN(now.getTime())) {
    return false;
  }
  return localDateKey(updated, timeZone) === localDateKey(now, timeZone);
}

export function millisecondsUntilNextLocalDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(1, next.getTime() - now.getTime());
}
