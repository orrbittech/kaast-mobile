import { apiClient } from '../client';
import type { UserProfile } from '../types';

export const usersApi = {
    /** GET /users/me - Current user profile */
    getMe: async (): Promise<UserProfile> => {
        const { data } = await apiClient.get<UserProfile>('/users/me');
        return data;
    },

    /** GET /users/me/export - Export user and org data */
    exportMe: async (): Promise<Record<string, unknown>> => {
        const { data } = await apiClient.get<Record<string, unknown>>(
            '/users/me/export',
        );
        return data;
    },

    /** DELETE /users/me - Delete account */
    deleteMe: async (): Promise<{ deleted: boolean }> => {
        const { data } = await apiClient.delete<{ deleted: boolean }>(
            '/users/me',
        );
        return data ?? { deleted: true };
    },
};
