import { useAuth } from '@clerk/clerk-expo';
import { useClerkOrganizations } from './useClerkOrganizations';
import { useLocations } from './useLocations';

export interface ActiveOrgContext {
    clerkOrgId: string | undefined;
    firstLocationId: string | undefined;
    locations: ReturnType<typeof useLocations>['data'];
    org: ReturnType<typeof useClerkOrganizations>['orgs'][number] | undefined;
    isLoading: boolean;
    isRefetching: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Resolves the active organization and first location for org-scoped screens.
 * Prefers Clerk's active org (`useAuth().orgId`) over the first membership.
 */
export function useActiveOrgContext(): ActiveOrgContext {
    const { orgId: activeOrgId, isLoaded: authLoaded } = useAuth();
    const {
        orgs,
        firstOrg,
        isLoading: orgsLoading,
        isRefetching: orgsRefetching,
        error: orgsError,
        refetch: refetchOrgs,
    } = useClerkOrganizations();

    const org =
        orgs.find((membership) => membership.clerkOrgId === activeOrgId) ??
        firstOrg;
    const clerkOrgId = activeOrgId ?? org?.clerkOrgId;

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
        org,
        isLoading: !authLoaded || orgsLoading,
        isRefetching: orgsRefetching || locationsRefetching,
        error: (orgsError ?? locationsError) as Error | null,
        refetch: async () => {
            await Promise.all([refetchOrgs(), refetchLocations()]);
        },
    };
}
