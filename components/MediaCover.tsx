import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Text } from './ui/Text';
import { colors } from '../lib/theme/colors';
import { isImageUrl } from '../lib/utils/media';

type FallbackSize = 'sm' | 'md' | 'lg';

interface MediaCoverProps {
    mediaUrl?: string | null;
    className?: string;
    style?: StyleProp<ViewStyle>;
    contentFit?: 'cover' | 'contain';
    fallbackSize?: FallbackSize;
}

const FALLBACK_FONT: Record<FallbackSize, number> = {
    sm: 20,
    md: 32,
    lg: 48,
};

function KaastKFallback({ size = 'md' }: { size?: FallbackSize }) {
    return (
        <View className="flex-1 items-center justify-center bg-zinc-700/80">
            <Text
                className="font-sans-semibold"
                style={{ fontSize: FALLBACK_FONT[size], color: colors.primaryHex }}
            >
                K
            </Text>
        </View>
    );
}

/** Image cover with red Kaast "K" fallback when URL is missing, not an image, or fails to load. */
export function MediaCover({
    mediaUrl,
    className,
    style,
    contentFit = 'cover',
    fallbackSize = 'md',
}: MediaCoverProps) {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [mediaUrl]);

    const showImage = !!mediaUrl && isImageUrl(mediaUrl) && !failed;

    return (
        <View className={className} style={style}>
            {showImage ? (
                <Image
                    source={{ uri: mediaUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit={contentFit}
                    onError={() => setFailed(true)}
                />
            ) : (
                <KaastKFallback size={fallbackSize} />
            )}
        </View>
    );
}
