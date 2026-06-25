import { apiClient } from '../client';
import type { PlanFeatureFlags, PlanLimits } from '../plan-features.config';

export type OrgPlanUsage = {
    devices: number;
    playlists: number;
    locations: number;
};

export interface BillingStatus {
    clerkOrgId: string;
    license: string | null;
    isActive: boolean;
    status: string;
    planSlug: string | null;
    trialEndsAt: string | null;
    periodEndAt: string | null;
    upgradeUrl: string;
    limits: PlanLimits;
    usage: OrgPlanUsage;
    features: PlanFeatureFlags;
}

export const billingApi = {
    getStatus: async (
        clerkOrgId: string,
        options?: { fresh?: boolean },
    ): Promise<BillingStatus> => {
        const { data } = await apiClient.get<BillingStatus>('/billing/status', {
            clerkOrgId,
            params: options?.fresh ? { fresh: '1' } : undefined,
        });
        return data;
    },
};
