import { useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';
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
    const lastUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (mediaUrl !== lastUrlRef.current) {
            lastUrlRef.current = mediaUrl ?? null;
            setFailed(false);
        }
    }, [mediaUrl]);

    const showImage = !!mediaUrl && (isImageUrl(mediaUrl) || mediaUrl.startsWith('data:')) && !failed;
    const recyclingKey = useMemo(
        () => (mediaUrl?.startsWith('data:') ? mediaUrl.slice(0, 64) : mediaUrl),
        [mediaUrl],
    );

    return (
        <View className={className} style={style}>
            {showImage ? (
                <Image
                    source={{ uri: mediaUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit={contentFit}
                    cachePolicy="memory-disk"
                    recyclingKey={recyclingKey ?? undefined}
                    transition={150}
                    onError={() => setFailed(true)}
                />
            ) : (
                <KaastKFallback size={fallbackSize} />
            )}
        </View>
    );
}
