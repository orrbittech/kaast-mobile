import { apiClient } from '../client';
import type { ApiRequestOptions } from '../request-config';
import type { Location, CreateLocation, UpdateLocation } from '../types';

export const locationsApi = {
    list: async (clerkOrgId: string, options?: ApiRequestOptions): Promise<Location[]> => {
        const { data } = await apiClient.get<Location[]>(
            `/orgs/${clerkOrgId}/locations`,
            { signal: options?.signal },
        );
        return data;
    },

    create: async (clerkOrgId: string, body: CreateLocation): Promise<Location> => {
        const { data } = await apiClient.post<Location>(
            `/orgs/${clerkOrgId}/locations`,
            body,
        );
        return data;
    },

    getById: async (
        clerkOrgId: string,
        id: string,
        options?: ApiRequestOptions,
    ): Promise<Location> => {
        const { data } = await apiClient.get<Location>(
            `/orgs/${clerkOrgId}/locations/${id}`,
            { signal: options?.signal },
        );
        return data;
    },

    update: async (
        clerkOrgId: string,
        id: string,
        body: UpdateLocation,
    ): Promise<Location> => {
        const { data } = await apiClient.patch<Location>(
            `/orgs/${clerkOrgId}/locations/${id}`,
            body,
        );
        return data;
    },

    delete: async (clerkOrgId: string, id: string): Promise<void> => {
        await apiClient.delete(`/orgs/${clerkOrgId}/locations/${id}`);
    },
};
