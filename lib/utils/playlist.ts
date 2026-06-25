import type { PlaylistItem } from "../api/types";
import { formatDurationLong } from "./formatDuration";
import { formatTimeLabel } from "../constants/playlist-form";

/** Sum item durations in seconds, ignoring missing values. */
export function getPlaylistTotalDurationSeconds(items?: PlaylistItem[]): number {
  if (!items?.length) return 0;
  return items.reduce((total, item) => {
    if (item.duration == null || item.duration < 0) return total;
    return total + item.duration;
  }, 0);
}

/** e.g. "3 items • 1h 20m" */
export function formatPlaylistStats(count: number, totalSeconds: number): string {
  const itemLabel = `${count} ${count === 1 ? "item" : "items"}`;
  const durationLabel = formatDurationLong(totalSeconds);
  if (durationLabel === "—") return itemLabel;
  return `${itemLabel} • ${durationLabel}`;
}

/** Convert schedule end time to "Until 5:00pm". */
export function formatUntilTime(endTime?: string | null): string {
  if (!endTime?.trim()) return "Until —";
  const normalized = formatTimeLabel(endTime);
  const [hoursPart, minutesPart] = normalized.split(":");
  const hours24 = Number(hoursPart);
  const minutes = Number(minutesPart ?? 0);
  if (Number.isNaN(hours24)) return "Until —";

  const period = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minuteSuffix = minutes > 0 ? `:${minutes.toString().padStart(2, "0")}` : ":00";
  return `Until ${hours12}${minuteSuffix}${period}`;
}
