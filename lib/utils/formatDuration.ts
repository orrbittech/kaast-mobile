/**
 * Format seconds to human-readable duration (e.g. "2h 15m", "45m").
 * Used for total play time and content duration display.
 */
export function formatDurationLong(seconds?: number): string {
    if (seconds == null || seconds < 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '< 1m';
}
