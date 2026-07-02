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
    type PlaylistSchedule,
    type CreatePlaylistSchedule,
    type UpdatePlaylistSchedule,
    type SetPlaylistScheduleDevices,
} from '../api';
import {
    invalidatePlaylists,
    invalidateDevices,
    invalidateAfterPlaylistAssignment,
    invalidateAfterPlaylistContentChange,
} from '../api/invalidate';
import { mediaApi } from '../api/services/media.api';
import { deviceKeys, mediaSessionKeys } from '../api/query-keys';
import type { DeviceWithMediaSession, MediaSession } from '../api/types';
import { showSuccessNotification } from '../notifications/successNotification';
import { getDisplayTitle } from '../utils/media';
import { useSubscriptionQueriesEnabled } from '../context/SubscriptionContext';

export type { Playlist, PlaylistItem } from '../api';

/** List playlists for an organization (includes items for counts and covers). */
export function usePlaylists(
    clerkOrgId: string | undefined,
    options?: { enabled?: boolean },
) {
    const queriesEnabled = useSubscriptionQueriesEnabled();
    return useQuery({
        queryKey: playlistKeys.mediaList(clerkOrgId ?? ''),
        queryFn: ({ signal }) => playlistsApi.listWithItems(clerkOrgId!, { signal }),
        enabled:
            (options?.enabled ?? true) && !!clerkOrgId && queriesEnabled,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });
}

/** Assigned playlist with items for a device. */
export function useAssignedPlaylist(
    deviceId: string | undefined,
    options?: { enabled?: boolean },
) {
    const queriesEnabled = useSubscriptionQueriesEnabled();
    return useQuery<Playlist | null>({
        queryKey: playlistKeys.assigned(deviceId ?? ''),
        queryFn: ({ signal }) => playlistsApi.getAssigned(deviceId!, { signal }),
        enabled: (options?.enabled ?? true) && !!deviceId && queriesEnabled,
        staleTime: 15_000,
        refetchOnWindowFocus: true,
    });
}

/** Single playlist with items. */
export function usePlaylist(id: string | undefined) {
    const queriesEnabled = useSubscriptionQueriesEnabled();
    return useQuery({
        queryKey: playlistKeys.detail(id ?? ''),
        queryFn: ({ signal }) => playlistsApi.getById(id!, { signal }),
        enabled: !!id && queriesEnabled,
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
                    playlistKeys.mediaList(orgId),
                    (old: Playlist[] | undefined) =>
                        old ? [...old, data] : [data],
                );
                invalidatePlaylists(queryClient, { clerkOrgId: orgId });
            }
            showSuccessNotification('Playlist created', data.name);
        },
    });
}

/** Create playlist with required initial schedule. */
export function useCreatePlaylistWithSchedule(clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (body: {
            name: string;
            locationId?: string | null;
            schedule: CreatePlaylistSchedule;
        }) => {
            const playlist = await playlistsApi.create({
                name: body.name,
                locationId: body.locationId ?? null,
            });
            try {
                await playlistsApi.createSchedule(playlist.id, body.schedule);
            } catch (error) {
                if (clerkOrgId) {
                    invalidatePlaylists(queryClient, { clerkOrgId });
                }
                throw error;
            }
            return playlist;
        },
        onSuccess: (data) => {
            const orgId = data.clerkOrgId ?? clerkOrgId;
            if (orgId) {
                queryClient.setQueryData(
                    playlistKeys.mediaList(orgId),
                    (old: Playlist[] | undefined) =>
                        old ? [...old, data] : [data],
                );
                invalidatePlaylists(queryClient, { clerkOrgId: orgId });
                void queryClient.invalidateQueries({
                    queryKey: playlistKeys.scheduleList(data.id),
                });
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
                    playlistKeys.mediaList(clerkOrgId),
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
                invalidateAfterPlaylistContentChange(queryClient, {
                    clerkOrgId,
                    playlistId: variables.id,
                });
            }
            showSuccessNotification('Playlist updated', data.name);
        },
    });
}

/** Update playlist and/or schedule with partial PATCH payloads. */
export function useUpdatePlaylistWithSchedule(clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (body: {
            playlistId: string;
            scheduleId: string | null;
            playlistPatch: UpdatePlaylist;
            schedulePatch: UpdatePlaylistSchedule;
        }) => {
            let playlist: Playlist | null = null;
            if (Object.keys(body.playlistPatch).length > 0) {
                playlist = await playlistsApi.update(body.playlistId, body.playlistPatch);
            }
            if (Object.keys(body.schedulePatch).length > 0) {
                if (body.scheduleId) {
                    await playlistsApi.updateSchedule(
                        body.playlistId,
                        body.scheduleId,
                        body.schedulePatch,
                    );
                } else {
                    await playlistsApi.createSchedule(
                        body.playlistId,
                        body.schedulePatch as CreatePlaylistSchedule,
                    );
                }
            }
            if (!playlist) {
                playlist = await playlistsApi.getById(body.playlistId);
            }
            return playlist;
        },
        onSuccess: (data, variables) => {
            if (clerkOrgId) {
                queryClient.setQueryData(
                    playlistKeys.mediaList(clerkOrgId),
                    (old: Playlist[] | undefined) =>
                        old
                            ? old.map((p) =>
                                  p.id === variables.playlistId ? { ...p, ...data } : p,
                              )
                            : [],
                );
            }
            queryClient.setQueryData(
                playlistKeys.detail(variables.playlistId),
                (old: Playlist | undefined) => (old ? { ...old, ...data } : undefined),
            );
            void queryClient.invalidateQueries({
                queryKey: playlistKeys.scheduleList(variables.playlistId),
            });
            if (clerkOrgId) {
                invalidatePlaylists(queryClient, {
                    clerkOrgId,
                    playlistId: variables.playlistId,
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
        mutationFn: ({ id }: { id: string; name: string }) =>
            playlistsApi.delete(id),
        onSuccess: (_, { id, name }) => {
            queryClient.removeQueries({ queryKey: playlistKeys.detail(id) });
            if (clerkOrgId) {
                queryClient.setQueryData(
                    playlistKeys.mediaList(clerkOrgId),
                    (old: Playlist[] | undefined) =>
                        old ? old.filter((p) => p.id !== id) : [],
                );
                invalidatePlaylists(queryClient, { clerkOrgId });
            }
            showSuccessNotification('Playlist deleted', name);
        },
    });
}

/** Add item to playlist. */
export function useAddPlaylistItem(playlistId: string | undefined, clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: CreatePlaylistItem) =>
            playlistsApi.addItem(playlistId!, body),
        onSuccess: (newItem, variables) => {
            if (playlistId) {
                queryClient.setQueryData(
                    playlistKeys.detail(playlistId),
                    (old: Playlist | undefined) =>
                        old
                            ? {
                                  ...old,
                                  items: [...(old.items ?? []), newItem].sort(
                                      (a, b) => a.order - b.order,
                                  ),
                              }
                            : old,
                );
            }
            if (clerkOrgId && playlistId) {
                queryClient.setQueryData(
                    playlistKeys.mediaList(clerkOrgId),
                    (old: Playlist[] | undefined) =>
                        old?.map((playlist) =>
                            playlist.id === playlistId
                                ? {
                                      ...playlist,
                                      items: [
                                          ...(playlist.items ?? []),
                                          newItem,
                                      ].sort((a, b) => a.order - b.order),
                                  }
                                : playlist,
                        ) ?? old,
                );
            }
            invalidateAfterPlaylistContentChange(queryClient, {
                clerkOrgId,
                playlistId: playlistId ?? undefined,
            });
            invalidateDevices(queryClient);
            const itemLabel = newItem.title ?? newItem.mediaUrl;
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
            invalidateAfterPlaylistContentChange(queryClient, {
                playlistId: playlistId ?? undefined,
                clerkOrgId,
            });
            invalidateDevices(queryClient);
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
            invalidateAfterPlaylistContentChange(queryClient, { clerkOrgId });
            invalidateDevices(queryClient);
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
            invalidateAfterPlaylistContentChange(queryClient, { clerkOrgId });
            invalidateDevices(queryClient);
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
            invalidateAfterPlaylistContentChange(queryClient, {
                playlistId: playlistId ?? undefined,
                clerkOrgId,
            });
            invalidateDevices(queryClient);
            showSuccessNotification('Removed from playlist');
        },
    });
}

/** Assign playlist to device and start playback on TV. */
export function useLoadPlaylistOnDevice(clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            playlistId,
            deviceId,
            deviceDbId,
            playlistName,
        }: {
            playlistId: string;
            deviceId: string;
            deviceDbId?: string;
            playlistName: string;
        }) => {
            await playlistsApi.assign(playlistId, deviceId);
            try {
                await mediaApi.sendCommand({
                    deviceId,
                    command: 'playPlaylist',
                    payload: { playlistId },
                });
            } catch {
                // Device offline or WS unavailable — assignment is persisted; TV will pick up on connect
            }
            return { playlistId, deviceId, deviceDbId, playlistName };
        },
        onSuccess: ({ playlistId, deviceId, deviceDbId, playlistName }) => {
            queryClient.setQueryData(
                mediaSessionKeys.detail(deviceId),
                (old: MediaSession | undefined) => ({
                    deviceId,
                    mediaUrl: old?.mediaUrl ?? null,
                    position: 0,
                    duration: old?.duration ?? 0,
                    playing: true,
                    volume: old?.volume ?? 1,
                    snapshotData: old?.snapshotData ?? null,
                    updatedAt: new Date().toISOString(),
                }),
            );

            if (deviceDbId) {
                queryClient.setQueryData(
                    deviceKeys.detail(deviceDbId),
                    (old: DeviceWithMediaSession | undefined) =>
                        old
                            ? {
                                  ...old,
                                  activePlaylistId: playlistId,
                                  activePlaylist: { id: playlistId, name: playlistName },
                                  mediaSession: {
                                      mediaUrl: old.mediaSession?.mediaUrl ?? null,
                                      position: 0,
                                      duration: old.mediaSession?.duration ?? 0,
                                      playing: true,
                                      volume: old.mediaSession?.volume ?? 1,
                                      snapshotData: old.mediaSession?.snapshotData ?? null,
                                  },
                              }
                            : old,
                );
                if (clerkOrgId) {
                    queryClient.setQueryData(
                        deviceKeys.list(clerkOrgId),
                        (old: import('../api').Device[] | undefined) =>
                            old?.map((d) =>
                                d.id === deviceDbId
                                    ? { ...d, activePlaylistId: playlistId }
                                    : d,
                            ) ?? old,
                    );
                }
            }

            void queryClient.invalidateQueries({
                queryKey: playlistKeys.assigned(deviceId),
            });

            invalidateAfterPlaylistAssignment(queryClient, {
                clerkOrgId,
                playlistId,
                deviceHardwareId: deviceId,
                deviceDbId,
            });
            showSuccessNotification('Playlist sent to device', playlistName);
        },
    });
}

/** Assign playlist to device. */
export function useAssignPlaylist(playlistId: string | undefined, clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (deviceId: string) =>
            playlistsApi.assign(playlistId!, deviceId),
        onSuccess: (_, deviceId) => {
            invalidateAfterPlaylistAssignment(queryClient, {
                playlistId: playlistId ?? undefined,
                clerkOrgId,
                deviceHardwareId: deviceId,
            });
            invalidateDevices(queryClient);
        },
    });
}

/** Unassign playlist from device. */
export function useUnassignPlaylist(playlistId: string | undefined, clerkOrgId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (deviceId: string) =>
            playlistsApi.unassign(playlistId!, deviceId),
        onSuccess: (_, deviceId) => {
            invalidateAfterPlaylistAssignment(queryClient, {
                playlistId: playlistId ?? undefined,
                clerkOrgId,
                deviceHardwareId: deviceId,
            });
            invalidateDevices(queryClient);
        },
    });
}

/** List schedule slots for a playlist. */
export function usePlaylistSchedules(playlistId: string | undefined) {
    return useQuery({
        queryKey: playlistKeys.scheduleList(playlistId ?? ''),
        queryFn: ({ signal }) => playlistsApi.listSchedules(playlistId!, { signal }),
        enabled: !!playlistId,
        staleTime: 15_000,
    });
}

export function useCreatePlaylistSchedule(playlistId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: CreatePlaylistSchedule) =>
            playlistsApi.createSchedule(playlistId!, body),
        onSuccess: () => {
            if (playlistId) {
                void queryClient.invalidateQueries({
                    queryKey: playlistKeys.scheduleList(playlistId),
                });
            }
            showSuccessNotification('Schedule created');
        },
    });
}

export function useUpdatePlaylistSchedule(playlistId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            scheduleId,
            body,
        }: {
            scheduleId: string;
            body: UpdatePlaylistSchedule;
        }) => playlistsApi.updateSchedule(playlistId!, scheduleId, body),
        onSuccess: () => {
            if (playlistId) {
                void queryClient.invalidateQueries({
                    queryKey: playlistKeys.scheduleList(playlistId),
                });
            }
            showSuccessNotification('Schedule updated');
        },
    });
}

export function useDeletePlaylistSchedule(playlistId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (scheduleId: string) =>
            playlistsApi.deleteSchedule(playlistId!, scheduleId),
        onSuccess: () => {
            if (playlistId) {
                void queryClient.invalidateQueries({
                    queryKey: playlistKeys.scheduleList(playlistId),
                });
            }
            showSuccessNotification('Schedule deleted');
        },
    });
}

export function useSetPlaylistScheduleDevices(playlistId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            scheduleId,
            body,
        }: {
            scheduleId: string;
            body: SetPlaylistScheduleDevices;
        }) => playlistsApi.setScheduleDevices(playlistId!, scheduleId, body),
        onSuccess: () => {
            if (playlistId) {
                void queryClient.invalidateQueries({
                    queryKey: playlistKeys.scheduleList(playlistId),
                });
            }
            showSuccessNotification('Schedule devices updated');
        },
    });
}

export function usePausePlaylistOnAllDevices(playlistId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => playlistsApi.pauseAll(playlistId!),
        onSuccess: (data) => {
            if (playlistId) {
                void queryClient.invalidateQueries({
                    queryKey: playlistKeys.devices(playlistId),
                });
            }
            showSuccessNotification(
                data.pausedCount > 0
                    ? `Paused on ${data.pausedCount} device${data.pausedCount === 1 ? '' : 's'}`
                    : 'No devices were playing',
            );
        },
    });
}

export function useResumePlaylistOnAllDevices(playlistId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => playlistsApi.resumeAll(playlistId!),
        onSuccess: (data) => {
            if (playlistId) {
                void queryClient.invalidateQueries({
                    queryKey: playlistKeys.devices(playlistId),
                });
            }
            showSuccessNotification(
                data.resumedCount > 0
                    ? `Resumed on ${data.resumedCount} device${data.resumedCount === 1 ? '' : 's'}`
                    : 'No paused devices to resume',
            );
        },
    });
}
