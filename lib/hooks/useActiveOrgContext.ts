import { useClerkOrganizations } from './useClerkOrganizations';
import { useLocations } from './useLocations';

export interface ActiveOrgContext {
    clerkOrgId: string | undefined;
    firstLocationId: string | undefined;
    locations: ReturnType<typeof useLocations>['data'];
    org: ReturnType<typeof useClerkOrganizations>['firstOrg'];
    isLoading: boolean;
    isRefetching: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Resolves the active organization and first location for org-scoped screens.
 * Mount once at drawer layout to prefetch shared context.
 */
export function useActiveOrgContext(): ActiveOrgContext {
    const {
        firstOrg,
        isLoading: orgsLoading,
        isRefetching: orgsRefetching,
        error: orgsError,
        refetch: refetchOrgs,
    } = useClerkOrganizations();
    const clerkOrgId = firstOrg?.clerkOrgId;
    const {
        data: locations,
        isLoading: locationsLoading,
        isRefetching: locationsRefetching,
        error: locationsError,
        refetch: refetchLocations,
    } = useLocations(clerkOrgId);
    const firstLocationId = locations?.[0]?.id;

    return {
        clerkOrgId,
        firstLocationId,
        locations,
        org: firstOrg,
        isLoading: orgsLoading,
        isRefetching: orgsRefetching || locationsRefetching,
        error: (orgsError ?? locationsError) as Error | null,
        refetch: async () => {
            await Promise.all([refetchOrgs(), refetchLocations()]);
        },
    };
}
