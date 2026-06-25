import { TIMEZONE_OPTIONS } from "./playlist-form";

export interface TimezoneOption {
  value: string;
  label: string;
  offsetMinutes: number;
}

function getTimezoneOffsetMinutes(timeZone: string, date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    });
    const part = formatter.formatToParts(date).find((p) => p.type === "timeZoneName");
    const raw = part?.value ?? "GMT";
    if (raw === "GMT" || raw === "UTC") return 0;
    const match = raw.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3] ?? 0);
    return sign * (hours * 60 + minutes);
  } catch {
    return 0;
  }
}

function formatOffsetLabel(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return minutes > 0
    ? `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    : `UTC${sign}${hours.toString().padStart(2, "0")}:00`;
}

function buildTimezoneOption(timeZone: string): TimezoneOption {
  const offsetMinutes = getTimezoneOffsetMinutes(timeZone);
  const offsetLabel = formatOffsetLabel(offsetMinutes);
  return {
    value: timeZone,
    offsetMinutes,
    label: `(${offsetLabel}) ${timeZone.replace(/_/g, " ")}`,
  };
}

function getSupportedTimezones(): string[] {
  try {
    const intl = Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    };
    if (typeof intl.supportedValuesOf === "function") {
      return intl.supportedValuesOf("timeZone");
    }
  } catch {
    // fall through to fallback list
  }
  return [...TIMEZONE_OPTIONS];
}

const ALL_TIMEZONE_OPTIONS: TimezoneOption[] = getSupportedTimezones()
  .map(buildTimezoneOption)
  .sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.value.localeCompare(b.value));

export function getTimezoneOptions(): TimezoneOption[] {
  return ALL_TIMEZONE_OPTIONS;
}

export function getTimezoneLabel(value: string): string {
  const match = ALL_TIMEZONE_OPTIONS.find((option) => option.value === value);
  if (match) return match.label;
  return buildTimezoneOption(value).label;
}

export function filterTimezoneOptions(query: string): TimezoneOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return ALL_TIMEZONE_OPTIONS;
  return ALL_TIMEZONE_OPTIONS.filter(
    (option) =>
      option.value.toLowerCase().includes(normalized) ||
      option.label.toLowerCase().includes(normalized),
  );
}
