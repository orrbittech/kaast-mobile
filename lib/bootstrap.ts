import { InteractionManager } from 'react-native';
import { queryClient } from './api/query-client';
import { devicesApi } from './api/services/devices.api';
import { billingApi } from './api/services/billing.api';
import { deviceKeys } from './api/query-keys';
import { billingStatusQueryKey } from './hooks/useSubscriptionStatus';
import { hasCompletedOnboarding } from './onboarding';

let onboardingPromise: Promise<boolean> | null = null;

/** Start onboarding SecureStore read as early as possible (call from root layout). */
export function prefetchOnboarding(): Promise<boolean> {
    if (!onboardingPromise) {
        onboardingPromise = hasCompletedOnboarding();
    }
    return onboardingPromise;
}

export function getOnboardingPrefetch(): Promise<boolean> | null {
    return onboardingPromise;
}

/** Warm device detail cache before navigating to the control screen. */
export function prefetchDeviceDetail(deviceDbId: string): void {
    void queryClient.prefetchQuery({
        queryKey: deviceKeys.detail(deviceDbId),
        queryFn: ({ signal }) => devicesApi.getById(deviceDbId, { signal }),
        staleTime: 15_000,
    });
}

/** Warm billing status without forcing a Clerk token refresh. */
export function prefetchBillingStatus(clerkOrgId: string): void {
    void queryClient.prefetchQuery({
        queryKey: billingStatusQueryKey(clerkOrgId),
        queryFn: () => billingApi.getStatus(clerkOrgId),
        staleTime: 10 * 60 * 1000,
    });
}

/** Run work after the current navigation transition / animations finish. */
export function runAfterInteractions(task: () => void): void {
    InteractionManager.runAfterInteractions(task);
}
