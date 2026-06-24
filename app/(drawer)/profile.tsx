import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Text } from '../../components/ui/Text';
import { UserAvatar } from '../../components/UserAvatar';
import { DRAWER_HEADER_HEIGHT } from '../../lib/constants';

function formatValue(value?: string | null) {
    return value?.trim() || 'Not available';
}

/**
 * Profile page - minimal user display.
 */
export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const user = useUser()?.user;
    const contentTopPadding = insets.top + DRAWER_HEADER_HEIGHT + 24;
    const primaryEmail = user?.primaryEmailAddress?.emailAddress;

    return (
        <ScrollView
            className="flex-1 bg-base"
            contentContainerStyle={{
                paddingTop: contentTopPadding,
                paddingHorizontal: 24,
                paddingBottom: 32,
            }}
        >
            <View className="items-center mb-6">
                <UserAvatar
                    imageUrl={user?.imageUrl}
                    fallbackInitial={
                        user?.firstName?.[0] ??
                        user?.emailAddresses?.[0]?.emailAddress?.[0] ??
                        '?'
                    }
                    size={80}
                    className="mb-4"
                />
                <Text className="text-2xl font-sans-semibold text-white text-center mb-1">
                    {user?.fullName ?? 'User'}
                </Text>
                <Text className="text-zinc-300 text-center">
                    {formatValue(primaryEmail)}
                </Text>
            </View>

            <Pressable
                onPress={() => router.push('/settings')}
                className="p-4 rounded-xl bg-zinc-700 active:opacity-80"
            >
                <Text className="font-sans-medium text-white text-center">
                    Account & Settings
                </Text>
            </Pressable>
        </ScrollView>
    );
}
