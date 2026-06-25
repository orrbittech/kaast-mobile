import { View, Pressable, Alert } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Text } from './ui/Text';
import { useSubscriptionStatus } from '../lib/hooks/useSubscriptionStatus';
import { useActiveOrgContext } from '../lib/hooks';
import {
    AccountPortalConfigError,
    openAccountPortalBillingAsync,
} from '../lib/openAccountPortal';

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
    const { org } = useActiveOrgContext();
    const isOrgAdmin = org?.role === 'org:admin';
    const { isLoading, isActive } = useSubscriptionStatus(clerkOrgId);

    const onSettings =
        segments.includes('settings' as never) ||
        segments[segments.length - 1] === 'settings';

    const openBilling = async () => {
        try {
            await openAccountPortalBillingAsync(clerkOrgId);
        } catch (err: unknown) {
            const message =
                err instanceof AccountPortalConfigError
                    ? err.message
                    : 'Could not open billing. Please try again.';
            Alert.alert('Not configured', message, [{ text: 'OK' }]);
        }
    };

    if (isLoading) return null;
    if (isActive || onSettings) return <>{children}</>;

    return (
        <View className="flex-1 items-center justify-center bg-base px-6">
            <Text className="text-2xl font-sans-semibold text-white mb-2 text-center">
                Trial ended
            </Text>
            <Text className="text-zinc-400 text-center mb-6">
                {isOrgAdmin
                    ? 'Your organization trial has ended. Subscribe to keep managing screens and media.'
                    : 'Your organization trial has ended. Contact your admin to subscribe.'}
            </Text>
            {isOrgAdmin ? (
                <Pressable
                    onPress={openBilling}
                    className="rounded-xl bg-primary px-6 py-4 mb-3 w-full max-w-sm items-center active:opacity-90"
                >
                    <Text className="font-sans-semibold text-white">
                        Subscribe now
                    </Text>
                </Pressable>
            ) : null}
            <Pressable
                onPress={() => router.push('/(drawer)/settings')}
                className="rounded-xl bg-zinc-800 px-6 py-4 w-full max-w-sm items-center active:opacity-90"
            >
                <Text className="font-sans-medium text-white">
                    {isOrgAdmin ? 'Settings' : 'Contact your admin'}
                </Text>
            </Pressable>
        </View>
    );
}
