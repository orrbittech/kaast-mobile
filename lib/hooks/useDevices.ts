import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    devicesApi,
    deviceKeys,
    locationKeys,
    type Device,
    type CreateDevice,
    type PairDevice,
    type DeviceWithMediaSession,
} from '../api';
import { showSuccessNotification } from '../notifications/successNotification';
import { useSubscriptionQueriesEnabled } from '../context/SubscriptionContext';

export type { Device };

/** List all devices for an organization. Refetches on app focus and uses 30s stale time. */
export function useDevices(clerkOrgId: string | undefined) {
    const queriesEnabled = useSubscriptionQueriesEnabled();
    return useQuery({
        queryKey: deviceKeys.list(clerkOrgId ?? ''),
        queryFn: ({ signal }) => devicesApi.list(clerkOrgId, { signal }),
        enabled: !!clerkOrgId && queriesEnabled,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });
}

/** Single device by UUID. Used for control screen and device detail. */
export function useDevice(id: string | undefined) {
    const queryClient = useQueryClient();
    const queriesEnabled = useSubscriptionQueriesEnabled();
    return useQuery({
        queryKey: deviceKeys.detail(id ?? ''),
        queryFn: ({ signal }) => devicesApi.getById(id!, { signal }),
        enabled: !!id && queriesEnabled,
        staleTime: 15_000,
        refetchOnWindowFocus: true,
        placeholderData: (previousData) => {
            if (previousData) return previousData;
            if (!id) return undefined;

            const listEntries = queryClient.getQueriesData<Device[]>({
                queryKey: deviceKeys.lists(),
            });

            for (const [, devices] of listEntries) {
                const match = devices?.find((device) => device.id === id);
                if (match) {
                    return {
                        ...match,
                        mediaSession: null,
                        activePlaylist: match.activePlaylistId
                            ? { id: match.activePlaylistId, name: '' }
                            : null,
                    } satisfies DeviceWithMediaSession;
                }
            }

            return undefined;
        },
    });
}

/** Create device. Org from token. Pass clerkOrgId for org-scoped JWT. */
export function useCreateDevice(clerkOrgId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: CreateDevice) => devicesApi.create(body, clerkOrgId),
        onSuccess: (data) => {
            if (clerkOrgId) {
                queryClient.setQueryData(deviceKeys.list(clerkOrgId), (old: Device[] | undefined) =>
                    old ? [...old, data] : [data],
                );
            }
            showSuccessNotification('Device created', data.name);
        },
    });
}

/** Update device. Optimistically updates list cache. */
export function useUpdateDevice(clerkOrgId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            body,
        }: {
            id: string;
            body: Partial<{ name: string; status: string; locationId: string | null; activePlaylistId: string | null }>;
        }) => devicesApi.update(id, body),
        onSuccess: (data, variables) => {
            if (clerkOrgId) {
                queryClient.setQueryData(deviceKeys.list(clerkOrgId), (old: Device[] | undefined) =>
                    old
                        ? old.map((d) => (d.id === variables.id ? { ...d, ...data } : d))
                        : [],
                );
            }
            queryClient.setQueryData(deviceKeys.detail(variables.id), (old: Device | undefined) =>
                old ? { ...old, ...data } : old,
            );
            showSuccessNotification('Device updated', data.name);
        },
    });
}

/** Delete device. Optimistically removes from list and detail cache. */
export function useDeleteDevice(clerkOrgId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => devicesApi.delete(id),
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: deviceKeys.detail(id) });
            if (clerkOrgId) {
                queryClient.setQueryData(deviceKeys.list(clerkOrgId), (old: Device[] | undefined) =>
                    old ? old.filter((d) => d.id !== id) : [],
                );
            }
            showSuccessNotification('Device deleted');
        },
    });
}

/** Pair device with 6-digit code. Org from token. */
export function usePairDevice(clerkOrgId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: PairDevice) => devicesApi.pair(body, clerkOrgId),
        onSuccess: (data) => {
            if (clerkOrgId) {
                queryClient.setQueryData(deviceKeys.list(clerkOrgId), (old: Device[] | undefined) =>
                    old ? [...old, data.device] : [data.device],
                );
                void queryClient.invalidateQueries({
                    queryKey: locationKeys.list(clerkOrgId),
                });
            }
            showSuccessNotification('Device paired', data.device.name);
        },
    });
}

/** Generate pairing code for TV device. */
export function useGeneratePairingCode() {
    return useMutation({
        mutationFn: (deviceId: string) =>
            devicesApi.generatePairingCode(deviceId),
    });
}
