import { useQuery } from '@tanstack/react-query';
import { locationsApi, locationKeys, type Location } from '../api';

export type { Location };

export function useLocations(clerkOrgId: string | undefined) {
    return useQuery({
        queryKey: locationKeys.list(clerkOrgId ?? ''),
        queryFn: ({ signal }) => locationsApi.list(clerkOrgId!, { signal }),
        enabled: !!clerkOrgId,
    });
}
