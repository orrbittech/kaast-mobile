/**
 * Status badge styling for device status (online, offline, pending/other).
 * Red for offline, green for online, amber for pending.
 */
export function getStatusBadgeClasses(status: string): {
    bg: string;
    text: string;
} {
    switch (status) {
        case 'online':
            return { bg: 'bg-approve', text: 'text-white' };
        case 'offline':
            return { bg: 'bg-primary', text: 'text-white' };
        default:
            return { bg: 'bg-pending', text: 'text-white' };
    }
}
