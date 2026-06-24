import { View, Pressable } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Text } from './ui/Text';
import { useSubscriptionStatus } from '../lib/hooks/useSubscriptionStatus';

interface TrialExpiredGateProps {
    clerkOrgId?: string;
    children: React.ReactNode;
}

/**
 * Blocks app content when org trial/subscription is inactive.
 * Settings remain accessible.
 */
export function TrialExpiredGate({
    clerkOrgId,
    children,
}: TrialExpiredGateProps) {
    const router = useRouter();
    const segments = useSegments();
    const { isLoading, isActive, upgradeUrl } =
        useSubscriptionStatus(clerkOrgId);

    const onSettings =
        segments.includes('settings' as never) ||
        segments[segments.length - 1] === 'settings';

    if (isLoading) return null;
    if (isActive || onSettings) return <>{children}</>;

    return (
        <View className="flex-1 items-center justify-center bg-base px-6">
            <Text className="text-2xl font-sans-semibold text-white mb-2 text-center">
                Trial ended
            </Text>
            <Text className="text-zinc-400 text-center mb-6">
                Your organization trial has ended. Subscribe at kaast.app to keep
                managing screens and media.
            </Text>
            <Pressable
                onPress={() => WebBrowser.openBrowserAsync(upgradeUrl)}
                className="rounded-xl bg-primary px-6 py-4 mb-3 w-full max-w-sm items-center active:opacity-90"
            >
                <Text className="font-sans-semibold text-white">
                    Subscribe now
                </Text>
            </Pressable>
            <Pressable
                onPress={() => router.push('/(drawer)/settings')}
                className="rounded-xl bg-zinc-800 px-6 py-4 w-full max-w-sm items-center active:opacity-90"
            >
                <Text className="font-sans-medium text-white">Settings</Text>
            </Pressable>
        </View>
    );
}
