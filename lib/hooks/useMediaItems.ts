import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { playlistsApi, playlistKeys } from '../api';

/** Playlist item reference for update/remove operations */
export interface MediaItemRef {
    playlistId: string;
    itemId: string;
}

/** Aggregated media item for display (deduplicated by mediaUrl) */
export interface MediaItemDisplay {
    mediaUrl: string;
    title?: string;
    duration?: number;
    createdAt?: string;
    playlistIds: string[];
    playlistNames: string[];
    items: MediaItemRef[];
}

/**
 * Fetches playlists with items in a single request and aggregates media URLs.
 */
export function useMediaItems(clerkOrgId: string | undefined) {
    const query = useQuery({
        queryKey: playlistKeys.mediaList(clerkOrgId ?? ''),
        queryFn: ({ signal }) => playlistsApi.listWithItems(clerkOrgId!, { signal }),
        enabled: !!clerkOrgId,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });

    const mediaItems = useMemo((): MediaItemDisplay[] => {
        const playlists = query.data ?? [];
        const map = new Map<
            string,
            {
                mediaUrl: string;
                title?: string;
                duration?: number;
                createdAt?: string;
                playlistIds: string[];
                playlistNames: string[];
                items: MediaItemRef[];
            }
        >();

        for (const playlist of playlists) {
            if (!playlist.items) continue;
            for (const item of playlist.items) {
                const itemCreatedAt = item.createdAt;
                const itemRef: MediaItemRef = { playlistId: playlist.id, itemId: item.id };
                const existing = map.get(item.mediaUrl);
                if (existing) {
                    existing.items.push(itemRef);
                    if (!existing.playlistIds.includes(playlist.id)) {
                        existing.playlistIds.push(playlist.id);
                        existing.playlistNames.push(playlist.name);
                    }
                    if (
                        itemCreatedAt &&
                        (!existing.createdAt || itemCreatedAt < existing.createdAt)
                    ) {
                        existing.createdAt = itemCreatedAt;
                    }
                } else {
                    map.set(item.mediaUrl, {
                        mediaUrl: item.mediaUrl,
                        title: item.title ?? undefined,
                        duration: item.duration ?? undefined,
                        createdAt: itemCreatedAt ?? undefined,
                        playlistIds: [playlist.id],
                        playlistNames: [playlist.name],
                        items: [itemRef],
                    });
                }
            }
        }

        return Array.from(map.values());
    }, [query.data]);

    return {
        data: mediaItems,
        isLoading: query.isLoading,
        isRefetching: query.isRefetching,
        error: query.error,
        refetch: query.refetch,
    };
}
