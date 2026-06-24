import { useQuery } from '@tanstack/react-query';
import { mediaApi, mediaSessionKeys, type MediaSession } from '../api';

export type { MediaSession };

export function useMediaSession(
    deviceId: string | undefined,
    options?: { enabled?: boolean },
) {
    return useQuery({
        queryKey: mediaSessionKeys.detail(deviceId ?? ''),
        queryFn: ({ signal }) => mediaApi.getSession(deviceId!, { signal }),
        enabled: (options?.enabled ?? true) && !!deviceId,
        refetchInterval: 5000,
    });
}
