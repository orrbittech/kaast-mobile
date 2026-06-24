import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, type ErrorBoundaryProps } from 'expo-router';
import { Text } from './ui/Text';

/**
 * Error boundary fallback UI for Expo Router.
 * Catches rendering errors in child routes and displays a recovery UI.
 * Uses app design system: dark theme, Urbanist font, approve accent.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
    return (
        <SafeAreaView className="flex-1 bg-base px-6 justify-center items-center">
            <View className="gap-4 max-w-[720px] items-center">
                <Text className="text-2xl font-sans-semibold text-white text-center">
                    Something went wrong
                </Text>
                <Text className="text-zinc-400 text-center" selectable>
                    {error.message}
                </Text>

                <View className="gap-3 items-center w-full">
                    <Pressable
                        onPress={() => retry()}
                        className="py-3 px-6 rounded-lg bg-approve active:opacity-90"
                    >
                        <Text className="font-sans-medium text-white">
                            Retry
                        </Text>
                    </Pressable>
                    <Link href="/" asChild>
                        <Pressable className="py-3 px-6 rounded-lg border border-zinc-600 active:opacity-90">
                            <Text className="font-sans-medium text-zinc-400">
                                Go Home
                            </Text>
                        </Pressable>
                    </Link>
                </View>

                {process.env.NODE_ENV === 'development' && (
                    <Link href="/_sitemap" className="mt-4">
                        <Text className="text-sm text-zinc-500 underline">
                            Sitemap
                        </Text>
                    </Link>
                )}
            </View>
        </SafeAreaView>
    );
}
