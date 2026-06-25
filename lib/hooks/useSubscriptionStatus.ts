import { useAuth } from '@clerk/clerk-expo';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/services/billing.api';
import { billingUrl, hasAnyOrgPlan } from '../billing-config';

export function invalidateSubscriptionStatus(
    queryClient: QueryClient,
    clerkOrgId?: string,
): void {
    void queryClient.invalidateQueries({
        queryKey: clerkOrgId
            ? ['billing', 'status', clerkOrgId]
            : ['billing', 'status'],
    });
}

export function useSubscriptionStatus(clerkOrgId?: string) {
    const { has, isLoaded } = useAuth();

    const hasPlanFromToken = hasAnyOrgPlan(has);

    const query = useQuery({
        queryKey: ['billing', 'status', clerkOrgId],
        queryFn: () => billingApi.getStatus(),
        enabled: !!clerkOrgId && isLoaded,
        staleTime: 60_000,
    });

    return {
        isLoading: !isLoaded || query.isLoading,
        isActive: hasPlanFromToken || query.data?.isActive === true,
        status: query.data?.status ?? 'unknown',
        trialEndsAt: query.data?.trialEndsAt ?? null,
        upgradeUrl: query.data?.upgradeUrl ?? billingUrl,
    };
}
