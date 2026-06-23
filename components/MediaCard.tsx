import { View, Pressable } from 'react-native';
import { Text } from './ui/Text';
import { MediaCover } from './MediaCover';
import type { MediaItemDisplay } from '../lib/hooks';
import {
    getDisplayTitle,
    getMediaTypeForFilter,
    formatDurationShort,
} from '../lib/utils/media';

interface MediaCardProps {
    item: MediaItemDisplay;
    onPress?: () => void;
}

function getMediaTypeLabel(mediaUrl: string): string {
    const type = getMediaTypeForFilter({ mediaUrl });
    switch (type) {
        case 'video':
            return 'Video';
        case 'audio':
            return 'Audio';
        case 'image':
            return 'Image';
        default:
            return 'Media';
    }
}

/** Truncate URL for display */
function truncateUrl(url: string, maxLen = 60): string {
    if (url.length <= maxLen) return url;
    return `${url.slice(0, maxLen - 3)}...`;
}

export function MediaCard({ item, onPress }: MediaCardProps) {
    const title = getDisplayTitle(item);
    const mediaType = getMediaTypeLabel(item.mediaUrl);

    return (
        <Pressable
            onPress={onPress}
            className="rounded-2xl bg-zinc-800 overflow-hidden active:opacity-90"
        >
            <View className="h-36 bg-zinc-700/60 relative overflow-hidden">
                <MediaCover mediaUrl={item.mediaUrl} fallbackSize="md" />
                <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded">
                    <Text className="text-xs text-white">{mediaType}</Text>
                </View>
            </View>
            <View className="p-4">
                <Text
                    className="text-base font-sans-semibold text-white mb-1"
                    numberOfLines={1}
                >
                    {title}
                </Text>
                <Text className="text-sm text-zinc-400 mb-2" numberOfLines={1}>
                    {truncateUrl(item.mediaUrl)}
                </Text>
                <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-zinc-500">
                        {formatDurationShort(item.duration)}
                    </Text>
                    <Text className="text-xs text-zinc-500">
                        {item.playlistNames.length} playlist
                        {item.playlistNames.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}
