import { Stack } from 'expo-router';

/**
 * Onboarding layout - Stack navigator for onboarding slides.
 * No header, full-screen slides.
 */
export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'fade',
            }}
        >
            <Stack.Screen name="index" />
        </Stack>
    );
}
