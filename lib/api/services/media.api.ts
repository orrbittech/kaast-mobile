import { apiClient } from '../client';
import type { ApiRequestOptions } from '../request-config';
import type { MediaSession, MediaCommand } from '../types';

export const mediaApi = {
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
