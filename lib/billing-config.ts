function requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`${name} is required. Add it to your .env file.`);
    }
    return value;
}

export const billingUrl = requireEnv('EXPO_PUBLIC_BILLING_URL');

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'past_due']);

/** JWT `pla` claim uses `o:org:starter` while Clerk plan slugs use `org:starter`. */
export function licenseToOrgPlanSlug(
    license: string | null | undefined,
): string | null {
    if (!license) return null;
    const match = license.match(/^o:(org:.+)$/);
    return match?.[1] ?? null;
}

export function hasActiveOrgPlanInLicense(
    license: string | null | undefined,
): boolean {
    return licenseToOrgPlanSlug(license) !== null;
}

export function isActiveClerkSubscriptionStatus(
    status: string | null | undefined,
): boolean {
    if (!status) return false;
    return ACTIVE_SUBSCRIPTION_STATUSES.has(status);
}

/** Human-readable label from a Clerk org plan slug (e.g. `org:starter` → `Starter`). */
export function formatPlanDisplayName(
    slug: string | null | undefined,
): string {
    if (!slug) return 'No plan';
    const name = slug.replace(/^org:/, '');
    if (!name) return 'No plan';
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            '=',
        );
        const json = atob(padded);
        return JSON.parse(json) as Record<string, unknown>;
    } catch {
        return null;
    }
}

/** Read active org plan from a Clerk session JWT body (`pla` claim). */
export function hasActiveOrgPlanInJwt(token: string | null | undefined): boolean {
    if (!token) return false;
    const payload = decodeJwtPayload(token);
    const pla = payload?.pla;
    return typeof pla === 'string' && pla.startsWith('o:org:');
}
