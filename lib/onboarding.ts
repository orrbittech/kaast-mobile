import * as SecureStore from 'expo-secure-store';

export const ONBOARDING_KEY = 'kaast_has_completed_onboarding';

export interface OnboardingSlide {
    title: string;
    /** Optional text to render in primary (red) color, e.g. brand name */
    highlight?: string;
}

/**
 * Onboarding slides - meaningful statements merged from title + subtext.
 */
export const SLIDES: OnboardingSlide[] = [
    {
        title: 'Take charge. Control every screen from your fingertips',
        highlight: 'KAAST -',
    },
    { title: 'Keep your brand locked in across every display' },
    {
        title: 'Run promotions, playlists, and updates on every screen right from your phone',
    },
    {
        title: 'Manage media across stores: music, images, menus, and more from one flow',
    },
    { title: 'Take charge. Get started now', highlight: 'KAAST - -' },
];

/**
 * Check if user has completed onboarding.
 * Uses SecureStore (native only); on web returns false.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
    try {
        const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
        return value === 'true';
    } catch {
        return false;
    }
}

/**
 * Mark onboarding as complete.
 * Uses SecureStore (native only); on web no-op.
 */
export async function setOnboardingComplete(): Promise<void> {
    try {
        await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    } catch {
        // SecureStore unavailable (e.g. web) - no-op
    }
}
