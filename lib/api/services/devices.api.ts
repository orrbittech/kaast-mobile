import { apiClient, type ApiRequestConfig } from '../client';
import type { ApiRequestOptions } from '../request-config';
import type {
    Device,
    DeviceWithMediaSession,
    CreateDevice,
    PairDevice,
    PairDeviceResponse,
    GeneratePairingCodeResponse,
} from '../types';

export const devicesApi = {
    generatePairingCode: async (
        deviceId: string,
    ): Promise<GeneratePairingCodeResponse> => {
        const { data } = await apiClient.post<GeneratePairingCodeResponse>(
            '/devices/pairing-code',
            { deviceId },
        );
        return data;
    },

    list: async (
        clerkOrgId?: string,
        options?: ApiRequestOptions,
    ): Promise<Device[]> => {
        if (!clerkOrgId || clerkOrgId === 'undefined' || clerkOrgId === 'null') {
            return [];
        }
        const config = { clerkOrgId, signal: options?.signal } as ApiRequestConfig & ApiRequestOptions;
        const { data } = await apiClient.get<Device[]>('/devices', config);
        return data;
    },

    create: async (body: CreateDevice, clerkOrgId?: string): Promise<Device> => {
        const config: ApiRequestConfig = clerkOrgId ? { clerkOrgId } : {};
        const { data } = await apiClient.post<Device>('/devices', body, config as Parameters<typeof apiClient.post>[2]);
        return data;
    },

    pair: async (body: PairDevice, clerkOrgId?: string): Promise<PairDeviceResponse> => {
        const config: ApiRequestConfig = clerkOrgId ? { clerkOrgId } : {};
        const { data } = await apiClient.post<PairDeviceResponse>('/devices/pair', body, config as Parameters<typeof apiClient.post>[2]);
        return data;
    },

    getById: async (
        id: string,
        options?: ApiRequestOptions,
    ): Promise<DeviceWithMediaSession> => {
        const { data } = await apiClient.get<DeviceWithMediaSession>(
            `/devices/${id}`,
            { signal: options?.signal },
        );
        return data;
    },

    update: async (
        id: string,
        body: Partial<{ name: string; status: string; locationId: string | null; activePlaylistId: string | null }>,
    ): Promise<Device> => {
        const { data } = await apiClient.patch<Device>(`/devices/${id}`, body);
        return data;
    },

    delete: async (id: string): Promise<{ deleted: boolean }> => {
        const { data } = await apiClient.delete<{ deleted: boolean }>(
            `/devices/${id}`,
        );
        return data ?? { deleted: true };
    },
};
