import { apiClient, type ApiRequestConfig } from '../client';
import type { ApiRequestOptions } from '../request-config';
import type {
    MediaSession,
    MediaCommand,
    MediaLibraryItem,
    CreateMediaLibraryItem,
    UpdateMediaLibraryItem,
    MediaLibraryUsage,
} from '../types';

export const mediaApi = {
    listLibrary: async (
        clerkOrgId: string,
        options?: ApiRequestOptions,
    ): Promise<MediaLibraryItem[]> => {
        const { data } = await apiClient.get<MediaLibraryItem[]>(
            `/media/library?orgId=${encodeURIComponent(clerkOrgId)}`,
            { signal: options?.signal },
        );
        return data;
    },

    createLibraryItem: async (
        body: CreateMediaLibraryItem,
        clerkOrgId?: string,
    ): Promise<MediaLibraryItem> => {
        const config: ApiRequestConfig = clerkOrgId ? { clerkOrgId } : {};
        const { data } = await apiClient.post<MediaLibraryItem>(
            '/media/library',
            body,
            config,
        );
        return data;
    },

    updateLibraryItem: async (
        id: string,
        body: UpdateMediaLibraryItem,
    ): Promise<MediaLibraryItem> => {
        const { data } = await apiClient.patch<MediaLibraryItem>(
            `/media/library/${id}`,
            body,
        );
        return data;
    },

    deleteLibraryItem: async (id: string): Promise<{ deleted: boolean }> => {
        const { data } = await apiClient.delete<{ deleted: boolean }>(
            `/media/library/${id}`,
        );
        return data ?? { deleted: true };
    },

    getLibraryItemUsage: async (id: string): Promise<MediaLibraryUsage> => {
        const { data } = await apiClient.get<MediaLibraryUsage>(
            `/media/library/${id}/usage`,
        );
        return data;
    },

    getSession: async (
        deviceId: string,
        options?: ApiRequestOptions,
    ): Promise<MediaSession> => {
        const { data } = await apiClient.get<MediaSession>(
            `/media/sessions/${deviceId}`,
            { signal: options?.signal },
        );
        return data;
    },

    sendCommand: async (body: MediaCommand): Promise<void> => {
        await apiClient.post('/media/commands', body);
    },
};
