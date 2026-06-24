import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    playlistsApi,
    playlistKeys,
    type PlaylistAssignedDevice,
    type PlaylistItem,
} from '../api';
import {
    getMediaTypeForFilter,
    type MediaFilterType,
} from '../utils/media';

export interface MediaTypeCounts {
    video: number;
    audio: number;
    image: number;
    media: number;
}

export interface PlaylistDeviceStats {
    assignedDevices: PlaylistAssignedDevice[];
    playingCount: number;
    notPlayingCount: number;
    onlineCount: number;
    offlineCount: number;
    mediaTypeCounts: MediaTypeCounts;
    isLoading: boolean;
}

function emptyMediaTypeCounts(): MediaTypeCounts {
    return { video: 0, audio: 0, image: 0, media: 0 };
}

function countMediaTypes(items?: PlaylistItem[]): MediaTypeCounts {
    const counts = emptyMediaTypeCounts();
    if (!items?.length) return counts;

    for (const item of items) {
        const type = getMediaTypeForFilter(item);
        counts[type as MediaFilterType] += 1;
    }

    return counts;
}

/**
 * Aggregates assigned/scheduled devices and media-type counts for playlist detail.
 */
export function usePlaylistDeviceStats(
    playlistId: string | undefined,
    _clerkOrgId: string | undefined,
    playlistItems?: PlaylistItem[],
): PlaylistDeviceStats {
    const { data: assignedDevices, isLoading } = useQuery({
        queryKey: playlistKeys.devices(playlistId ?? ''),
        queryFn: ({ signal }) => playlistsApi.getDevices(playlistId!, { signal }),
        enabled: !!playlistId,
        refetchInterval: 5_000,
        staleTime: 4_000,
    });

    const stats = useMemo(() => {
        const devices = assignedDevices ?? [];
        let playingCount = 0;
        let notPlayingCount = 0;
        let onlineCount = 0;
        let offlineCount = 0;

        for (const device of devices) {
            if (device.status === 'online') {
                onlineCount += 1;
            } else {
                offlineCount += 1;
            }

            if (device.isPlaying) {
                playingCount += 1;
            } else {
                notPlayingCount += 1;
            }
        }

        return {
            assignedDevices: devices,
            playingCount,
            notPlayingCount,
            onlineCount,
            offlineCount,
            mediaTypeCounts: countMediaTypes(playlistItems),
        };
    }, [assignedDevices, playlistItems]);

    return {
        ...stats,
        isLoading: !!playlistId && isLoading,
    };
}
