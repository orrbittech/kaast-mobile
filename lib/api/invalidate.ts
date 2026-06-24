import type { QueryClient } from '@tanstack/react-query';
import {
    deviceKeys,
    locationKeys,
    playlistKeys,
    userKeys,
    mediaSessionKeys,
    mediaLibraryKeys,
} from './query-keys';
import { clearAppCache } from './query-client';
import type { Device } from './types';

export function invalidateDevices(queryClient: QueryClient): void {
    void queryClient.invalidateQueries({ queryKey: deviceKeys.all });
}

export function invalidatePlaylists(
    queryClient: QueryClient,
    options?: { clerkOrgId?: string; playlistId?: string },
): void {
    if (options?.playlistId) {
        void queryClient.invalidateQueries({
            queryKey: playlistKeys.detail(options.playlistId),
        });
    }
    if (options?.clerkOrgId) {
        void queryClient.invalidateQueries({
            queryKey: playlistKeys.list(options.clerkOrgId),
        });
        void queryClient.invalidateQueries({
            queryKey: playlistKeys.mediaList(options.clerkOrgId),
        });
    }
    if (!options?.clerkOrgId && !options?.playlistId) {
        void queryClient.invalidateQueries({ queryKey: playlistKeys.all });
    }
}

export function invalidateAfterPair(
    queryClient: QueryClient,
    clerkOrgId: string,
): void {
    invalidateDevices(queryClient);
    void queryClient.invalidateQueries({
        queryKey: locationKeys.list(clerkOrgId),
    });
}

export function invalidateMediaLibrary(
    queryClient: QueryClient,
    clerkOrgId?: string,
): void {
    if (clerkOrgId) {
        void queryClient.invalidateQueries({
            queryKey: mediaLibraryKeys.list(clerkOrgId),
        });
        return;
    }
    void queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.all });
}

export function invalidateOnSignOut(): void {
    clearAppCache();
}

export function invalidateUser(queryClient: QueryClient): void {
    void queryClient.invalidateQueries({ queryKey: userKeys.me });
}

export function invalidateMediaSession(
    queryClient: QueryClient,
    deviceId: string,
): void {
    void queryClient.invalidateQueries({
        queryKey: mediaSessionKeys.detail(deviceId),
    });
}

/** Refetch device, playlist, media session, and library caches after assignment or load changes. */
export function invalidateAfterPlaylistAssignment(
    queryClient: QueryClient,
    options: {
        clerkOrgId?: string;
        playlistId?: string;
        deviceHardwareId?: string;
        deviceDbId?: string;
    },
): void {
    const refetchActive = (queryKey: readonly unknown[]) => {
        void queryClient.refetchQueries({ queryKey, type: 'active' });
    };

    if (options.clerkOrgId) {
        refetchActive(playlistKeys.list(options.clerkOrgId));
        refetchActive(playlistKeys.mediaList(options.clerkOrgId));
        refetchActive(deviceKeys.list(options.clerkOrgId));
        refetchActive(mediaLibraryKeys.list(options.clerkOrgId));
    }
    if (options.playlistId) {
        refetchActive(playlistKeys.detail(options.playlistId));
    }
    if (options.deviceDbId) {
        refetchActive(deviceKeys.detail(options.deviceDbId));
    }
    if (options.deviceHardwareId) {
        refetchActive(mediaSessionKeys.detail(options.deviceHardwareId));
        refetchActive(playlistKeys.assigned(options.deviceHardwareId));
    }

    void queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    void queryClient.invalidateQueries({ queryKey: playlistKeys.all });
    void queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.all });
}

/** Refresh saved and device-assigned playlist caches after content changes. */
export function invalidateAfterPlaylistContentChange(
    queryClient: QueryClient,
    options: {
        clerkOrgId?: string;
        playlistId?: string;
        deviceHardwareId?: string;
        deviceDbId?: string;
    },
): void {
    invalidateAfterPlaylistAssignment(queryClient, options);

    if (options.clerkOrgId && options.playlistId) {
        const devices = queryClient.getQueryData<Device[]>(
            deviceKeys.list(options.clerkOrgId),
        );
        for (const device of devices ?? []) {
            if (
                device.activePlaylistId === options.playlistId &&
                device.deviceId
            ) {
                void queryClient.refetchQueries({
                    queryKey: playlistKeys.assigned(device.deviceId),
                    type: 'active',
                });
            }
        }
    }
}
