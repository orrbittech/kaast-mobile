import { useAuth } from '@clerk/clerk-expo';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/services/billing.api';
import { billingUrl } from '../billing-config';
import { getPlanFeatureFlags, getPlanLimits } from '../plan-features.config';
import { queryClient } from '../api/query-client';

const BILLING_STALE_TIME_MS = 10 * 60 * 1000;

export function billingStatusQueryKey(clerkOrgId?: string) {
    return clerkOrgId
        ? (['billing', 'status', clerkOrgId] as const)
        : (['billing', 'status'] as const);
}

export function invalidateSubscriptionStatus(
    client: QueryClient,
    clerkOrgId?: string,
): void {
    void client.invalidateQueries({
        queryKey: billingStatusQueryKey(clerkOrgId),
    });
}

/** Force-refresh JWT claims and billing status (sign-in, org switch, billing return). */
export async function refreshBillingStatus(
    clerkOrgId: string,
    getToken: ReturnType<typeof useAuth>['getToken'],
    options?: { fresh?: boolean },
): Promise<void> {
    await getToken({ skipCache: true, organizationId: clerkOrgId });
    invalidateSubscriptionStatus(queryClient, clerkOrgId);

    if (!options?.fresh) {
        return;
    }

    await queryClient.fetchQuery({
        queryKey: billingStatusQueryKey(clerkOrgId),
        queryFn: () => billingApi.getStatus(clerkOrgId, { fresh: true }),
    });
}

/**
 * Org subscription status from Clerk via GET /billing/status (Clerk BAPI on server).
 * Does not gate on JWT `pla` alone — server reads live Clerk subscription.
 */
export function useSubscriptionStatus(clerkOrgId?: string) {
    const { isLoaded } = useAuth();

    const query = useQuery({
        queryKey: billingStatusQueryKey(clerkOrgId),
        queryFn: () => billingApi.getStatus(clerkOrgId!),
        enabled: !!clerkOrgId && isLoaded,
        staleTime: BILLING_STALE_TIME_MS,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: 2,
        initialData: () =>
            clerkOrgId
                ? queryClient.getQueryData(billingStatusQueryKey(clerkOrgId))
                : undefined,
    });

    const isActive = query.data?.isActive === true;
    const planSlug = query.data?.planSlug ?? null;
    const limits = query.data?.limits ?? getPlanLimits(planSlug);
    const usage = query.data?.usage ?? { devices: 0, playlists: 0, locations: 0 };
    const features = query.data?.features ?? getPlanFeatureFlags(planSlug);
    const atDeviceLimit =
        limits.maxDevices !== null && usage.devices >= limits.maxDevices;

    return {
        isLoading: !isLoaded || !clerkOrgId || (query.isPending && !query.data),
        isActive,
        status: query.data?.status ?? 'unknown',
        planSlug,
        trialEndsAt: query.data?.trialEndsAt ?? null,
        upgradeUrl: query.data?.upgradeUrl ?? billingUrl,
        limits,
        usage,
        features,
        atDeviceLimit,
        refetch: query.refetch,
    };
}
