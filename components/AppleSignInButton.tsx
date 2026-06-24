import { useCallback } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSignInWithApple } from '@clerk/clerk-expo';
import { Text } from './ui/Text';
import { showErrorNotification } from '../lib/notifications/successNotification';

/**
 * Sign in with Apple button - native flow, iOS only.
 * Uses Clerk's useSignInWithApple hook with expo-apple-authentication.
 */
export function AppleSignInButton() {
    const router = useRouter();
    const { startAppleAuthenticationFlow } = useSignInWithApple();

    const handlePress = useCallback(async () => {
        try {
            const { createdSessionId, setActive } =
                await startAppleAuthenticationFlow();

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
                router.replace('/(drawer)');
            }
        } catch (err: unknown) {
            const code =
                err && typeof err === 'object' && 'code' in err
                    ? (err as { code?: string }).code
                    : undefined;
            if (code === 'ERR_REQUEST_CANCELED') return;

            const message =
                err && typeof err === 'object' && 'message' in err
                    ? String((err as { message?: string }).message)
                    : 'An error occurred during Apple Sign-In';
            void showErrorNotification('Error', message);
        }
    }, [startAppleAuthenticationFlow, router]);

    if (Platform.OS !== 'ios') {
        return null;
    }

    return (
        <Pressable
            onPress={handlePress}
            className="py-3 rounded-lg bg-white border border-zinc-700 active:opacity-90"
        >
            <View className="flex-row items-center justify-center gap-2">
                <Image
                    source={require('../assets/icons/apple.png')}
                    style={{ width: 24, height: 24 }}
                    contentFit="contain"
                />
                <Text className="font-sans-medium text-black">      
                    Sign in with Apple
                </Text>
            </View>
        </Pressable>
    );
}
