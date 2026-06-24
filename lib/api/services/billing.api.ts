import { apiClient } from '../client';

export interface BillingStatus {
    clerkOrgId: string;
    license: string | null;
    isActive: boolean;
    status: string;
    planSlug: string | null;
    trialEndsAt: string | null;
    periodEndAt: string | null;
    upgradeUrl: string;
}

export const billingApi = {
    getStatus: async (): Promise<BillingStatus> => {
        const { data } = await apiClient.get<BillingStatus>('/billing/status');
        return data;
    },
};
