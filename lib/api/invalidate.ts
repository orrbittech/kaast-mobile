import type { QueryClient } from '@tanstack/react-query';
import {
    deviceKeys,
    locationKeys,
    playlistKeys,
    userKeys,
    mediaSessionKeys,
} from './query-keys';
import { clearAppCache } from './query-client';

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
