import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Text } from '../components/ui/Text';
import { queryClient } from '../lib/api/query-client';
import { invalidateSubscriptionStatus } from '../lib/hooks/useSubscriptionStatus';
import { useActiveOrgContext } from '../lib/hooks';

/**
 * Deep-link callback after Account Portal billing completes.
 * Refreshes JWT plan claims and billing status, then returns to the app.
 */
export default function BillingCallbackScreen() {
    const router = useRouter();
    const { getToken, isLoaded } = useAuth();
    const { clerkOrgId } = useActiveOrgContext();

    useEffect(() => {
        if (!isLoaded) return;

        let cancelled = false;

        async function handleReturn() {
            invalidateSubscriptionStatus(queryClient, clerkOrgId);
            await getToken({ skipCache: true });

            if (cancelled) return;

            router.replace('/(drawer)');
        }

        void handleReturn();

        return () => {
            cancelled = true;
        };
    }, [clerkOrgId, getToken, isLoaded, router]);

    return (
        <View className="flex-1 bg-base justify-center items-center px-6">
            <Text className="text-zinc-400">Updating subscription...</Text>
        </View>
    );
}
