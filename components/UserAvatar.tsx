import { View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from './ui/Text';

export interface UserAvatarProps {
    /** Clerk user imageUrl - when present, shows profile image */
    imageUrl?: string | null;
    /** Fallback initial when no image (e.g. first letter of name) */
    fallbackInitial?: string;
    /** Size in pixels (default 40) */
    size?: number;
    /** Optional additional className for the container */
    className?: string;
}

/**
 * User avatar - displays profile image when available, otherwise initial letter.
 */
export function UserAvatar({
    imageUrl,
    fallbackInitial = '?',
    size = 40,
    className = '',
}: UserAvatarProps) {
    const hasImage = Boolean(imageUrl);

    return (
        <View
            className={`rounded-full bg-zinc-700 items-center justify-center overflow-hidden ${className}`}
            style={{ width: size, height: size }}
        >
            {hasImage ? (
                <Image
                    source={{ uri: imageUrl! }}
                    style={{ width: size, height: size }}
                    contentFit="cover"
                />
            ) : (
                <Text
                    className="text-white font-sans-medium"
                    style={{
                        fontSize: size * 0.45,
                    }}
                >
                    {fallbackInitial}
                </Text>
            )}
        </View>
    );
}
