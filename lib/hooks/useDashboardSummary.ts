import { useMemo } from 'react';
import { useActiveOrgContext } from './useActiveOrgContext';
import { useDevices } from './useDevices';
import { usePlaylists } from './usePlaylists';
import { useMediaItems } from './useMediaItems';

export interface DashboardSummary {
    totalDevices: number;
    activeDevices: number;
    inactiveDevices: number;
    mediaFileCount: number;
    totalPlayTimeSec: number;
    totalPlaylists: number;
    activePlaylistCount: number;
    clerkOrgId: string | undefined;
    firstLocationId: string | undefined;
    firstDeviceId: string | undefined;
    firstDeviceDbId: string | undefined;
    firstDeviceName: string | undefined;
    isLoading: boolean;
    isOrgLoading: boolean;
    isDevicesLoading: boolean;
    isPlaylistsLoading: boolean;
    isMediaLoading: boolean;
    error: Error | null;
}

/**
 * Aggregates org, location, devices, playlists, and media for dashboard summary.
 */
export function useDashboardSummary(): DashboardSummary {
    const { clerkOrgId, firstLocationId, isLoading: orgLoading, error } =
        useActiveOrgContext();
    const { data: devices, isLoading: devicesLoading } = useDevices(clerkOrgId);
    const { data: playlists, isLoading: playlistsLoading } =
        usePlaylists(clerkOrgId);
    const { data: mediaItems, isLoading: mediaLoading } =
        useMediaItems(clerkOrgId);

    const summary = useMemo(() => {
        const totalDevices = devices?.length ?? 0;
        const activeDevices =
            devices?.filter((d) => d.status === 'online').length ?? 0;
        const inactiveDevices = totalDevices - activeDevices;
        const mediaFileCount = mediaItems?.length ?? 0;
        const totalPlayTimeSec =
            mediaItems?.reduce((acc, i) => acc + (i.duration ?? 0), 0) ?? 0;
        const totalPlaylists = playlists?.length ?? 0;
        const activePlaylistIds = new Set(
            devices
                ?.filter((d) => d.activePlaylistId)
                .map((d) => d.activePlaylistId)
                .filter((id): id is string => !!id) ?? [],
        );
        const activePlaylistCount = activePlaylistIds.size;
        const firstDevice = devices?.[0];

        return {
            totalDevices,
            activeDevices,
            inactiveDevices,
            mediaFileCount,
            totalPlayTimeSec,
            totalPlaylists,
            activePlaylistCount,
            firstDeviceId: firstDevice?.deviceId,
            firstDeviceDbId: firstDevice?.id,
            firstDeviceName: firstDevice?.name,
        };
    }, [devices, mediaItems, playlists]);

    const isOrgLoading = orgLoading;
    const isDevicesLoading = devicesLoading;
    const isPlaylistsLoading = playlistsLoading;
    const isMediaLoading = mediaLoading;
    const isLoading = isOrgLoading;

    return {
        ...summary,
        clerkOrgId,
        firstLocationId,
        isLoading,
        isOrgLoading,
        isDevicesLoading,
        isPlaylistsLoading,
        isMediaLoading,
        error,
    };
}
