import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSSO } from '@clerk/clerk-expo';
import { Text } from './ui/Text';
import { showErrorNotification } from '../lib/notifications/successNotification';

/**
 * Sign in with Google button - OAuth flow via browser.
 * Uses Clerk's useSSO hook with oauth_google strategy.
 */
export function GoogleSignInButton() {
    const router = useRouter();
    const { startSSOFlow } = useSSO();
    const [loading, setLoading] = useState(false);

    const handlePress = useCallback(async () => {
        setLoading(true);
        try {
            const { createdSessionId, setActive } = await startSSOFlow({
                strategy: 'oauth_google',
                redirectUrl: 'apk://sso-callback',
            });

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
                router.replace('/(drawer)');
            }
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object' && 'message' in err
                    ? String((err as { message?: string }).message)
                    : 'An error occurred during Google Sign-In';
            void showErrorNotification('Error', message);
        } finally {
            setLoading(false);
        }
    }, [startSSOFlow, router]);

    return (
        <Pressable
            onPress={handlePress}
            disabled={loading}
            className="py-3 rounded-lg bg-zinc-800 border border-zinc-600 active:opacity-90 disabled:opacity-50"
        >
            <View className="flex-row items-center justify-center gap-2">
                <Image
                    source={require('../assets/icons/google.png')}
                    style={{ width: 24, height: 24 }}
                    contentFit="contain"
                />
                <Text className="font-sans-medium text-white">
                    {loading ? 'Signing in...' : 'Sign in with Google'}
                </Text>
            </View>
        </Pressable>
    );
}
