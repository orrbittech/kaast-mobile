import { AppState, type AppStateStatus } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { queryClient } from './api/query-client';
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
    invalidateSubscriptionStatus(queryClient, clerkOrgId);
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
