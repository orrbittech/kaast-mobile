/** Common IANA timezones for playlist schedules. */
export const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

export type SchedulePriority = "low" | "medium" | "high";

export const PRIORITY_OPTIONS: { value: SchedulePriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const PRIORITY_CHIP_CLASSES: Record<SchedulePriority, string> = {
  low: "bg-approve",
  medium: "bg-pending",
  high: "bg-primary",
};

export function formatPriorityLabel(priority: SchedulePriority | string): string {
  const match = PRIORITY_OPTIONS.find((option) => option.value === priority);
  return match?.label ?? String(priority);
}

export function parseDateString(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseTimeString(value: string): Date {
  const parts = value.split(":");
  const date = new Date();
  date.setHours(Number(parts[0]) || 0, Number(parts[1]) || 0, 0, 0);
  return date;
}

export function formatTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function normalizeSchedulePriority(
  priority: SchedulePriority | number | string | undefined,
): SchedulePriority {
  if (priority === "low" || priority === "medium" || priority === "high") {
    return priority;
  }
  if (typeof priority === "number") {
    if (priority <= 0) return "low";
    if (priority === 1) return "medium";
    return "high";
  }
  return "medium";
}

export function formatTimeLabel(time: string): string {
  return time.slice(0, 5);
}
