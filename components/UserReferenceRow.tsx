import { View } from 'react-native';
import { UserAvatar } from './UserAvatar';
import { Text } from './ui/Text';
import type { UserSummary } from '../lib/api/types';

export interface UserReferenceRowProps {
    label: string;
    user?: UserSummary | null;
}

function getDisplayName(user: UserSummary): string {
    const fromParts = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return fromParts || user.name || 'Unknown user';
}

function getFallbackInitial(user: UserSummary): string {
    return (
        user.firstName?.[0] ??
        user.name?.[0] ??
        user.lastName?.[0] ??
        '?'
    ).toUpperCase();
}

/**
 * Device detail row showing a user label with avatar and full name.
 */
export function UserReferenceRow({ label, user }: UserReferenceRowProps) {
    return (
        <View className="flex-row justify-between items-center">
            <Text className="text-zinc-500 text-sm">{label}</Text>
            {user ? (
                <View className="flex-row items-center gap-2 max-w-[60%]">
                    <UserAvatar
                        imageUrl={user.imageUrl}
                        fallbackInitial={getFallbackInitial(user)}
                        size={28}
                    />
                    <Text
                        className="font-sans-medium text-white text-sm flex-shrink"
                        numberOfLines={1}
                    >
                        {getDisplayName(user)}
                    </Text>
                </View>
            ) : (
                <Text className="font-sans-medium text-white text-sm">—</Text>
            )}
        </View>
    );
}
