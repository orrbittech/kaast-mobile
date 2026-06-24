import { apiClient } from '../client';
import type {
    Playlist,
    PlaylistItem,
    CreatePlaylist,
    UpdatePlaylist,
    CreatePlaylistItem,
    UpdatePlaylistItem,
    PlaylistSchedule,
    CreatePlaylistSchedule,
    UpdatePlaylistSchedule,
    SetPlaylistScheduleDevices,
} from '../types';
import type { ApiRequestOptions } from '../request-config';

export const playlistsApi = {
    /** GET /playlists?orgId - List playlists for organization */
    list: async (clerkOrgId: string, options?: ApiRequestOptions): Promise<Playlist[]> => {
        const { data } = await apiClient.get<Playlist[]>(
            `/playlists?orgId=${encodeURIComponent(clerkOrgId)}`,
            { signal: options?.signal },
        );
        return data;
    },

    /** GET /playlists/media?orgId - List playlists with items (media library) */
    listWithItems: async (
        clerkOrgId: string,
        options?: ApiRequestOptions,
    ): Promise<Playlist[]> => {
        const { data } = await apiClient.get<Playlist[]>(
            `/playlists/media?orgId=${encodeURIComponent(clerkOrgId)}`,
            { signal: options?.signal },
        );
        return data;
    },

    create: async (body: CreatePlaylist): Promise<Playlist> => {
        const { data } = await apiClient.post<Playlist>('/playlists', body);
        return data;
    },

    getById: async (id: string, options?: ApiRequestOptions): Promise<Playlist> => {
        const { data } = await apiClient.get<Playlist>(`/playlists/${id}`, {
            signal: options?.signal,
        });
        return data;
    },

    update: async (id: string, body: UpdatePlaylist): Promise<Playlist> => {
        const { data } = await apiClient.patch<Playlist>(`/playlists/${id}`, body);
        return data;
    },

    delete: async (id: string): Promise<{ deleted: boolean }> => {
        const { data } = await apiClient.delete<{ deleted: boolean }>(
            `/playlists/${id}`,
        );
        return data ?? { deleted: true };
    },

    addItem: async (
        playlistId: string,
        body: CreatePlaylistItem,
    ): Promise<PlaylistItem> => {
        const { data } = await apiClient.post<PlaylistItem>(
            `/playlists/${playlistId}/items`,
            body,
        );
        return data;
    },

    updateItem: async (
        playlistId: string,
        itemId: string,
        body: UpdatePlaylistItem,
    ): Promise<PlaylistItem> => {
        const { data } = await apiClient.patch<PlaylistItem>(
            `/playlists/${playlistId}/items/${itemId}`,
            body,
        );
        return data;
    },

    removeItem: async (
        playlistId: string,
        itemId: string,
    ): Promise<{ deleted: boolean }> => {
        const { data } = await apiClient.delete<{ deleted: boolean }>(
            `/playlists/${playlistId}/items/${itemId}`,
        );
        return data ?? { deleted: true };
    },

    assign: async (
        playlistId: string,
        deviceId: string,
    ): Promise<{ assigned: boolean; playlistId: string; deviceId: string }> => {
        const { data } = await apiClient.post(
            `/playlists/${playlistId}/assign/${deviceId}`,
        );
        return data;
    },

    unassign: async (
        playlistId: string,
        deviceId: string,
    ): Promise<{ unassigned: boolean; deviceId: string }> => {
        const { data } = await apiClient.delete(
            `/playlists/${playlistId}/unassign/${deviceId}`,
        );
        return data;
    },

    /** GET /playlists/assigned/:deviceId - Assigned playlist with items for device */
    getAssigned: async (
        deviceId: string,
        options?: ApiRequestOptions,
    ): Promise<Playlist | null> => {
        const { data } = await apiClient.get<Playlist | null>(
            `/playlists/assigned/${encodeURIComponent(deviceId)}`,
            { signal: options?.signal },
        );
        return data;
    },

    listSchedules: async (
        playlistId: string,
        options?: ApiRequestOptions,
    ): Promise<PlaylistSchedule[]> => {
        const { data } = await apiClient.get<PlaylistSchedule[]>(
            `/playlists/${playlistId}/schedules`,
            { signal: options?.signal },
        );
        return data;
    },

    createSchedule: async (
        playlistId: string,
        body: CreatePlaylistSchedule,
    ): Promise<PlaylistSchedule> => {
        const { data } = await apiClient.post<PlaylistSchedule>(
            `/playlists/${playlistId}/schedules`,
            body,
        );
        return data;
    },

    updateSchedule: async (
        playlistId: string,
        scheduleId: string,
        body: UpdatePlaylistSchedule,
    ): Promise<PlaylistSchedule> => {
        const { data } = await apiClient.patch<PlaylistSchedule>(
            `/playlists/${playlistId}/schedules/${scheduleId}`,
            body,
        );
        return data;
    },

    deleteSchedule: async (
        playlistId: string,
        scheduleId: string,
    ): Promise<{ deleted: boolean }> => {
        const { data } = await apiClient.delete<{ deleted: boolean }>(
            `/playlists/${playlistId}/schedules/${scheduleId}`,
        );
        return data ?? { deleted: true };
    },

    setScheduleDevices: async (
        playlistId: string,
        scheduleId: string,
        body: SetPlaylistScheduleDevices,
    ): Promise<PlaylistSchedule> => {
        const { data } = await apiClient.put<PlaylistSchedule>(
            `/playlists/${playlistId}/schedules/${scheduleId}/devices`,
            body,
        );
        return data;
    },

    getDevices: async (
        playlistId: string,
        options?: ApiRequestOptions,
    ): Promise<import('../types').PlaylistAssignedDevice[]> => {
        const { data } = await apiClient.get<import('../types').PlaylistAssignedDevice[]>(
            `/playlists/${playlistId}/devices`,
            { signal: options?.signal },
        );
        return data;
    },

    pauseAll: async (
        playlistId: string,
    ): Promise<{ pausedCount: number; totalDevices: number }> => {
        const { data } = await apiClient.post<{ pausedCount: number; totalDevices: number }>(
            `/playlists/${playlistId}/pause`,
        );
        return data;
    },

    resumeAll: async (
        playlistId: string,
    ): Promise<{ resumedCount: number; totalDevices: number }> => {
        const { data } = await apiClient.post<{ resumedCount: number; totalDevices: number }>(
            `/playlists/${playlistId}/resume`,
        );
        return data;
    },
};
