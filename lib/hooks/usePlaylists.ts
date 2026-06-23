import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    playlistsApi,
    playlistKeys,
    type Playlist,
    type CreatePlaylist,
    type UpdatePlaylist,
    type CreatePlaylistItem,
    type UpdatePlaylistItem,
} from '../api';
import { invalidatePlaylists } from '../api/invalidate';
import { showSuccessNotification } from '../notifications/successNotification';

export type { Playlist, PlaylistItem } from '../api';

/** List playlists for an organization. */
export function usePlaylists(clerkOrgId: string | undefined) {
    return useQuery({
        queryKey: playlistKeys.list(clerkOrgId ?? ''),
        queryFn: ({ signal }) => playlistsApi.list(clerkOrgId!, { signal }),
        enabled: !!clerkOrgId,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });
}

/** Single playlist with items. */
export function usePlaylist(id: string | undefined) {
    return useQuery({
        queryKey: playlistKeys.detail(id ?? ''),
        queryFn: ({ signal }) => playlistsApi.getById(id!, { signal }),
        enabled: !!id,
        staleTime: 15_000,
        refetchOnWindowFocus: true,
    });
}

/** Create playlist. */
export function useCreatePlaylist(clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: CreatePlaylist) => playlistsApi.create(body),
        onSuccess: (data) => {
            const orgId = data.clerkOrgId ?? clerkOrgId;
            if (orgId) {
                queryClient.setQueryData(
                    playlistKeys.list(orgId),
                    (old: Playlist[] | undefined) =>
                        old ? [...old, data] : [data],
                );
                invalidatePlaylists(queryClient, { clerkOrgId: orgId });
            }
            showSuccessNotification('Playlist created', data.name);
        },
    });
}

/** Update playlist. */
export function useUpdatePlaylist(clerkOrgId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            body,
        }: {
            id: string;
            body: UpdatePlaylist;
        }) => playlistsApi.update(id, body),
        onSuccess: (data, variables) => {
            if (clerkOrgId) {
                queryClient.setQueryData(
                    playlistKeys.list(clerkOrgId),
                    (old: Playlist[] | undefined) =>
                        old
                            ? old.map((p) =>
                                  p.id === variables.id ? { ...p, ...data } : p,
                              )
                            : [],
                );
            }
            queryClient.setQueryData(
                playlistKeys.detail(variables.id),
                (old: Playlist | undefined) =>
                    old ? { ...old, ...data } : undefined,
            );
            if (clerkOrgId) {
                invalidatePlaylists(queryClient, {
                    clerkOrgId,
                    playlistId: variables.id,
                });
            }
            showSuccessNotification('Playlist updated', data.name);
        },
    });
}

/** Delete playlist. */
export function useDeletePlaylist(clerkOrgId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => playlistsApi.delete(id),
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: playlistKeys.detail(id) });
            if (clerkOrgId) {
                queryClient.setQueryData(
                    playlistKeys.list(clerkOrgId),
                    (old: Playlist[] | undefined) =>
                        old ? old.filter((p) => p.id !== id) : [],
                );
                invalidatePlaylists(queryClient, { clerkOrgId });
            }
            showSuccessNotification('Playlist deleted');
        },
    });
}

/** Add item to playlist. */
export function useAddPlaylistItem(playlistId: string | undefined, clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: CreatePlaylistItem) =>
            playlistsApi.addItem(playlistId!, body),
        onSuccess: (_, variables) => {
            invalidatePlaylists(queryClient, {
                playlistId: playlistId ?? undefined,
                clerkOrgId,
            });
            const itemLabel = variables.mediaUrl ?? variables.title ?? 'Item';
            showSuccessNotification('Added to playlist', itemLabel);
        },
    });
}

/** Update playlist item. */
export function useUpdatePlaylistItem(playlistId: string | undefined, clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            itemId,
            body,
        }: {
            itemId: string;
            body: UpdatePlaylistItem;
        }) => playlistsApi.updateItem(playlistId!, itemId, body),
        onSuccess: () => {
            invalidatePlaylists(queryClient, {
                playlistId: playlistId ?? undefined,
                clerkOrgId,
            });
        },
    });
}

/** Batch update playlist items. */
export function useBatchUpdatePlaylistItems(clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            updates: {
                playlistId: string;
                itemId: string;
                body: UpdatePlaylistItem;
            }[],
        ) => {
            await Promise.all(
                updates.map((u) =>
                    playlistsApi.updateItem(u.playlistId, u.itemId, u.body),
                ),
            );
        },
        onSuccess: () => {
            invalidatePlaylists(queryClient, { clerkOrgId });
            showSuccessNotification('Media updated');
        },
    });
}

/** Batch remove playlist items. */
export function useBatchRemovePlaylistItems(clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            items: { playlistId: string; itemId: string }[],
        ) => {
            await Promise.all(
                items.map((i) =>
                    playlistsApi.removeItem(i.playlistId, i.itemId),
                ),
            );
        },
        onSuccess: () => {
            invalidatePlaylists(queryClient, { clerkOrgId });
            showSuccessNotification('Removed from playlists');
        },
    });
}

/** Remove item from playlist. */
export function useRemovePlaylistItem(playlistId: string | undefined, clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (itemId: string) =>
            playlistsApi.removeItem(playlistId!, itemId),
        onSuccess: () => {
            invalidatePlaylists(queryClient, {
                playlistId: playlistId ?? undefined,
                clerkOrgId,
            });
            showSuccessNotification('Removed from playlist');
        },
    });
}

/** Assign playlist to device. */
export function useAssignPlaylist(playlistId: string | undefined, clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (deviceId: string) =>
            playlistsApi.assign(playlistId!, deviceId),
        onSuccess: () => {
            invalidatePlaylists(queryClient, {
                playlistId: playlistId ?? undefined,
                clerkOrgId,
            });
        },
    });
}

/** Unassign playlist from device. */
export function useUnassignPlaylist(playlistId: string | undefined, clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (deviceId: string) =>
            playlistsApi.unassign(playlistId!, deviceId),
        onSuccess: () => {
            invalidatePlaylists(queryClient, {
                playlistId: playlistId ?? undefined,
                clerkOrgId,
            });
        },
    });
}
