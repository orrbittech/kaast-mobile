import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../api/services/billing.api';

export function useSubscriptionStatus(clerkOrgId?: string) {
    const { has, isLoaded } = useAuth();

    const hasPlanFromToken =
        has?.({ plan: 'org:starter' }) ||
        has?.({ plan: 'org:growth' }) ||
        has?.({ plan: 'org:scale' });

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
        upgradeUrl: query.data?.upgradeUrl ?? 'https://kaast.app/billing',
    };
}
