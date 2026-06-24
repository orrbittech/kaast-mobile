import { useEffect } from 'react';
import { View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Text } from '../../components/ui/Text';

/**
 * SSO callback route - handles OAuth redirect from Google (and other providers).
 * Calls maybeCompleteAuthSession to dismiss the browser and allow the
 * startSSOFlow promise to resolve. The social sign-in button handles navigation.
 */
export default function SSOCallbackScreen() {
    useEffect(() => {
        WebBrowser.maybeCompleteAuthSession();
    }, []);

    return (
        <View className="flex-1 bg-base justify-center items-center px-6">
            <Text className="text-zinc-400">Completing sign-in...</Text>
        </View>
    );
}
