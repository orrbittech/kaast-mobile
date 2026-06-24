import { View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { UserAvatar } from './UserAvatar';
import { Text } from './ui/Text';

/**
 * Header avatar with greeting - used in drawer/screen headers. Links to profile.
 */
export function HeaderAvatar() {
    const userData = useUser();
    const user = userData?.user;
    const imageUrl = user?.imageUrl ?? null;
    const fallbackInitial =
        user?.firstName?.[0] ??
        user?.emailAddresses?.[0]?.emailAddress?.[0] ??
        '?';
    const greeting = user?.firstName ? `Hi, ${user.firstName}` : 'Hi User';

    return (
        <View className="flex-row items-center gap-3 mr-4">
            <Text className="font-sans-semibold text-white">{greeting}</Text>
            <Link href="/profile" asChild>
                <Pressable className="active:opacity-80">
                    <UserAvatar
                        imageUrl={imageUrl}
                        fallbackInitial={fallbackInitial}
                        size={40}
                    />
                </Pressable>
            </Link>
        </View>
    );
}
