import { createContext, useContext, type ReactNode } from 'react';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import {
    getPlanFeatureFlags,
    getPlanLimits,
    type PlanFeatureFlags,
    type PlanLimits,
} from '../plan-features.config';
import type { OrgPlanUsage } from '../api/services/billing.api';

interface SubscriptionContextValue {
    isLoading: boolean;
    isActive: boolean;
    status: string;
    planSlug: string | null;
    trialEndsAt: string | null;
    upgradeUrl: string;
    limits: PlanLimits;
    usage: OrgPlanUsage;
    features: PlanFeatureFlags;
    atDeviceLimit: boolean;
    /** True only when Clerk reports an active org subscription. */
    queriesEnabled: boolean;
    refetch: () => Promise<unknown>;
}

const defaultValue: SubscriptionContextValue = {
    isLoading: true,
    isActive: false,
    status: 'unknown',
    planSlug: null,
    trialEndsAt: null,
    upgradeUrl: '',
    limits: getPlanLimits(null),
    usage: { devices: 0, playlists: 0, locations: 0 },
    features: getPlanFeatureFlags(null),
    atDeviceLimit: false,
    queriesEnabled: false,
    refetch: async () => {},
};

const SubscriptionContext =
    createContext<SubscriptionContextValue>(defaultValue);

interface SubscriptionProviderProps {
    clerkOrgId?: string;
    children: ReactNode;
}

/** Resolves org subscription once for the drawer shell and child queries. */
export function SubscriptionProvider({
    clerkOrgId,
    children,
}: SubscriptionProviderProps) {
    const {
        isLoading,
        isActive,
        status,
        planSlug,
        trialEndsAt,
        upgradeUrl,
        limits,
        usage,
        features,
        atDeviceLimit,
        refetch,
    } = useSubscriptionStatus(clerkOrgId);

    const queriesEnabled = isActive;

    return (
        <SubscriptionContext.Provider
            value={{
                isLoading,
                isActive,
                status,
                planSlug,
                trialEndsAt,
                upgradeUrl,
                limits,
                usage,
                features,
                atDeviceLimit,
                queriesEnabled,
                refetch,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscriptionGate(): SubscriptionContextValue {
    return useContext(SubscriptionContext);
}

/** Whether subscription-guarded list/detail queries should run. */
export function useSubscriptionQueriesEnabled(): boolean {
    return useContext(SubscriptionContext).queriesEnabled;
}
