import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { hasCompletedOnboarding } from '../lib/onboarding';

/**
 * Root redirect - onboarding → auth → drawer.
 * Checks SecureStore for onboarding and Clerk for auth.
 */
export default function IndexRedirect() {
    const { isSignedIn, isLoaded } = useAuth();
    const [onboardingComplete, setOnboardingComplete] = useState<
        boolean | null
    >(null);

    useEffect(() => {
        hasCompletedOnboarding().then(setOnboardingComplete);
    }, []);

    if (onboardingComplete === null || !isLoaded) {
        return null;
    }

    if (!onboardingComplete) {
        return <Redirect href="/(onboarding)" />;
    }

    if (!isSignedIn) {
        return <Redirect href="/sign-in" />;
    }

    return <Redirect href="/(drawer)" />;
}
