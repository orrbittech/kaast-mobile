import { AppState, type AppStateStatus } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getClerkInstance } from '@clerk/clerk-expo';
import { queryClient } from './api/query-client';
import { billingApi } from './api/services/billing.api';
import { hasActiveOrgPlanInJwt } from './billing-config';
import { invalidateSubscriptionStatus } from './hooks/useSubscriptionStatus';

const accountPortalProfileUrl =
    process.env.EXPO_PUBLIC_CLERK_ACCOUNT_PORTAL_URL?.trim();
const accountPortalBillingUrl =
    process.env.EXPO_PUBLIC_CLERK_ACCOUNT_PORTAL_BILLING_URL?.trim();
const mobileBillingReturnUrl =
    process.env.EXPO_PUBLIC_MOBILE_BILLING_RETURN_URL?.trim();

export class AccountPortalConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AccountPortalConfigError';
    }
}

/** Append redirect_url to an Account Portal page URL. */
export function buildAccountPortalUrl(
    baseUrl: string,
    returnUrl: string,
): string {
    const url = new URL(baseUrl);
    url.searchParams.set('redirect_url', returnUrl);
    return url.toString();
}

function requireMobileBillingReturnUrl(): string {
    if (!mobileBillingReturnUrl) {
        throw new AccountPortalConfigError(
            'EXPO_PUBLIC_MOBILE_BILLING_RETURN_URL is not set. Add it to your .env file.',
        );
    }
    return mobileBillingReturnUrl;
}

function requireBaseUrl(
    baseUrl: string | undefined,
    envName: string,
): string {
    if (!baseUrl) {
        throw new AccountPortalConfigError(
            `${envName} is not set. Add it to your .env file.`,
        );
    }
    return baseUrl;
}

async function refreshSubscriptionAfterPortal(
    clerkOrgId?: string,
): Promise<void> {
    const clerk = getClerkInstance();
    await clerk.session?.getToken({
        skipCache: true,
        organizationId: clerkOrgId,
    });
    invalidateSubscriptionStatus(queryClient, clerkOrgId);
    if (clerkOrgId) {
        await queryClient.fetchQuery({
            queryKey: ['billing', 'status', clerkOrgId],
            queryFn: () => billingApi.getStatus(clerkOrgId, { fresh: true }),
        });
    }
}

/**
 * Refresh the session token and check JWT body + Clerk-backed billing status.
 * Returns true when the org already has an active plan (skip Account Portal).
 */
export async function refreshAndCheckSubscriptionActive(
    clerkOrgId?: string,
): Promise<boolean> {
    const clerk = getClerkInstance();
    const token = await clerk.session?.getToken({
        skipCache: true,
        organizationId: clerkOrgId,
    });

    if (hasActiveOrgPlanInJwt(token)) {
        return true;
    }

    try {
        const status = await billingApi.getStatus(clerkOrgId ?? '', {
            fresh: true,
        });
        return status.isActive;
    } catch {
        return false;
    }
}

/** Opens Account Portal billing only when the org has no active plan in Clerk. */
export async function openAccountPortalBillingIfNeeded(
    clerkOrgId?: string,
): Promise<boolean> {
    const alreadyActive = await refreshAndCheckSubscriptionActive(clerkOrgId);
    if (alreadyActive) {
        invalidateSubscriptionStatus(queryClient, clerkOrgId);
        return false;
    }

    await openAccountPortalBillingAsync(clerkOrgId);
    return true;
}

/** Opens an Account Portal page in the in-app browser with a domain-safe return URL. */
export async function openAccountPortalAsync(options: {
    baseUrl: string;
    clerkOrgId?: string;
}): Promise<void> {
    const returnUrl = requireMobileBillingReturnUrl();
    const portalUrl = buildAccountPortalUrl(options.baseUrl, returnUrl);

    const subscription = AppState.addEventListener(
        'change',
        (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                void refreshSubscriptionAfterPortal(options.clerkOrgId);
                subscription.remove();
            }
        },
    );

    try {
        const result = await WebBrowser.openBrowserAsync(portalUrl);
        if (result.type === 'dismiss' || result.type === 'cancel') {
            await refreshSubscriptionAfterPortal(options.clerkOrgId);
        }
    } finally {
        subscription.remove();
    }
}

export async function openAccountPortalBillingAsync(
    clerkOrgId?: string,
): Promise<void> {
    const baseUrl = requireBaseUrl(
        accountPortalBillingUrl,
        'EXPO_PUBLIC_CLERK_ACCOUNT_PORTAL_BILLING_URL',
    );
    await openAccountPortalAsync({ baseUrl, clerkOrgId });
}

export async function openAccountPortalProfileAsync(
    clerkOrgId?: string,
): Promise<void> {
    const baseUrl = requireBaseUrl(
        accountPortalProfileUrl,
        'EXPO_PUBLIC_CLERK_ACCOUNT_PORTAL_URL',
    );
    await openAccountPortalAsync({ baseUrl, clerkOrgId });
}
