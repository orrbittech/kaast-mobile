import { useEffect, useMemo } from 'react';
import { useOrganizationList } from '@clerk/clerk-expo';

/** Organization membership from Clerk (single source of truth). */
export interface ClerkOrganization {
    clerkOrgId: string;
    name: string;
    slug?: string;
    role: string;
}

/**
 * Lists organizations the signed-in user belongs to via Clerk SDK.
 * Activates the first membership so org-scoped JWT claims are available.
 */
export function useClerkOrganizations() {
    const { isLoaded, setActive, userMemberships } = useOrganizationList({
        userMemberships: { pageSize: 100 },
    });

    const orgs = useMemo<ClerkOrganization[]>(() => {
        return (userMemberships.data ?? []).map((membership) => ({
            clerkOrgId: membership.organization.id,
            name: membership.organization.name ?? 'Organization',
            slug: membership.organization.slug ?? undefined,
            role: membership.role,
        }));
    }, [userMemberships.data]);

    const firstOrg = orgs[0];

    useEffect(() => {
        if (!isLoaded || !firstOrg?.clerkOrgId) return;
        void setActive({ organization: firstOrg.clerkOrgId });
    }, [isLoaded, firstOrg?.clerkOrgId, setActive]);

    return {
        orgs,
        firstOrg,
        isLoading: !isLoaded,
        isRefetching: userMemberships.isFetching,
        error: (userMemberships.error as Error | null) ?? null,
        refetch: async () => {
            await userMemberships.revalidate?.();
        },
    };
}
