import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    CreateMediaLibraryItem,
    UpdateMediaLibraryItem,
    MediaLibraryItem,
} from '../api/types';
import { mediaLibraryKeys } from '../api/query-keys';
import { mediaApi } from '../api/services/media.api';
import { invalidateMediaLibrary } from '../api/invalidate';
import { showSuccessNotification } from '../notifications/successNotification';
import { getDisplayTitle } from '../utils/media';
import { useSubscriptionQueriesEnabled } from '../context/SubscriptionContext';

/** Playlist item reference for legacy batch playlist operations */
export interface MediaItemRef {
    playlistId: string;
    itemId: string;
}

/** Media library item for display across Media and Playlists screens */
export interface MediaItemDisplay {
    id: string;
    mediaUrl: string;
    title?: string;
    duration?: number;
    createdAt?: string;
    playlistIds: string[];
    playlistNames: string[];
    items: MediaItemRef[];
}

function toMediaItemDisplay(item: MediaLibraryItem): MediaItemDisplay {
    return {
        id: item.id,
        mediaUrl: item.url,
        title: item.title,
        duration: item.duration ?? undefined,
        createdAt: item.createdAt,
        playlistIds: [],
        playlistNames: [],
        items: [],
    };
}

/**
 * Fetches org media library items from the media table.
 */
export function useMediaItems(clerkOrgId: string | undefined) {
    const queriesEnabled = useSubscriptionQueriesEnabled();
    const query = useQuery({
        queryKey: mediaLibraryKeys.list(clerkOrgId ?? ''),
        queryFn: ({ signal }) => mediaApi.listLibrary(clerkOrgId!, { signal }),
        enabled: !!clerkOrgId && queriesEnabled,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });

    const mediaItems = useMemo(
        (): MediaItemDisplay[] => (query.data ?? []).map(toMediaItemDisplay),
        [query.data],
    );

    return {
        data: mediaItems,
        isLoading: query.isLoading,
        isRefetching: query.isRefetching,
        error: query.error,
        refetch: query.refetch,
    };
}

/** Create a media library item (persists in the media table). */
export function useCreateMediaItem(clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: CreateMediaLibraryItem) =>
            mediaApi.createLibraryItem(body, clerkOrgId),
        onSuccess: (_, variables) => {
            invalidateMediaLibrary(queryClient, clerkOrgId);
            const itemLabel = getDisplayTitle({
                mediaUrl: variables.url,
                title: variables.title,
            });
            showSuccessNotification('Media saved', itemLabel);
        },
    });
}

/** Update a media library item. */
export function useUpdateMediaItem(clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            body,
        }: {
            id: string;
            body: UpdateMediaLibraryItem;
        }) => mediaApi.updateLibraryItem(id, body),
        onSuccess: () => {
            invalidateMediaLibrary(queryClient, clerkOrgId);
            showSuccessNotification('Media updated');
        },
    });
}

/** Delete a media library item. */
export function useDeleteMediaItem(clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => mediaApi.deleteLibraryItem(id),
        onSuccess: () => {
            invalidateMediaLibrary(queryClient, clerkOrgId);
            showSuccessNotification('Media deleted');
        },
    });
}
