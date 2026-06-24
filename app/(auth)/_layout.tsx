import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

/**
 * Auth layout - Stack navigator for sign-in and sign-up screens.
 * Redirects to drawer home when user is already signed in.
 */
export default function AuthLayout() {
    const { isSignedIn } = useAuth();

    if (isSignedIn) {
        return <Redirect href="/" />;
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="reset-password" />
            <Stack.Screen name="sso-callback" />
        </Stack>
    );
}
