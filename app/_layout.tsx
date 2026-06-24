/** KAAST — Proprietary software of Orrbit Systems (https://www.orrbit.co.za/) */
import { useEffect } from 'react';
import { Appearance, AppState, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import {
    QueryClientProvider,
    focusManager,
} from '@tanstack/react-query';
import { queryClient } from '../lib/api/query-client';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { useFonts } from '@expo-google-fonts/urbanist/useFonts';
import {
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
} from '@expo-google-fonts/urbanist';
import { IndieFlower_400Regular } from '@expo-google-fonts/indie-flower';
import '../lib/theme/global.css';
import { NetworkErrorHandler } from '../components/NetworkErrorHandler';
import { requestNotificationPermissions } from '../lib/notifications/successNotification';

/** Suppress Clerk development keys warning in dev console */
if (__DEV__) {
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
        const msg = typeof args[0] === 'string' ? args[0] : '';
        if (msg.startsWith('Clerk: Clerk has been loaded with development keys')) return;
        originalWarn.apply(console, args);
    };
}

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from '../components/ErrorBoundary';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
    throw new Error(
        'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it to your .env file.',
    );
}

/**
 * Root layout - wraps auth and drawer groups.
 * Default route is / (drawer home). Auth at /sign-in, /sign-up.
 * App defaults to dark mode with Urbanist font.
 */
export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Urbanist_400Regular,
        Urbanist_500Medium,
        Urbanist_600SemiBold,
        IndieFlower_400Regular,
    });

    useEffect(() => {
        Appearance.setColorScheme('dark');
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (status) => {
            focusManager.setFocused(status === 'active');
        });
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    useEffect(() => {
        requestNotificationPermissions();
    }, []);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <NetworkErrorHandler />
            <ClerkProvider
                publishableKey={publishableKey}
                tokenCache={tokenCache}
            >
                <StatusBar
                    style="light"
                    translucent={Platform.OS === 'android'}
                    backgroundColor={
                        Platform.OS === 'android' ? 'transparent' : undefined
                    }
                />
                <Stack
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <Stack.Screen
                        name="index"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="(onboarding)"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="(auth)"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="(drawer)"
                        options={{ headerShown: false }}
                    />
                </Stack>
            </ClerkProvider>
        </QueryClientProvider>
    );
}
