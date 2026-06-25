import { useQuery } from '@tanstack/react-query';
import { mediaApi, mediaSessionKeys, type MediaSession } from '../api';
import { useSubscriptionQueriesEnabled } from '../context/SubscriptionContext';

export type { MediaSession };

export function useMediaSession(
    deviceId: string | undefined,
    options?: { enabled?: boolean; pollWhenDisconnected?: boolean },
) {
    const queriesEnabled = useSubscriptionQueriesEnabled();
    const pollWhenDisconnected = options?.pollWhenDisconnected ?? true;

    return useQuery({
        queryKey: mediaSessionKeys.detail(deviceId ?? ''),
        queryFn: ({ signal }) => mediaApi.getSession(deviceId!, { signal }),
        enabled:
            (options?.enabled ?? true) &&
            !!deviceId &&
            queriesEnabled &&
            pollWhenDisconnected,
        refetchInterval: pollWhenDisconnected ? 5000 : false,
        staleTime: 4_000,
    });
}
