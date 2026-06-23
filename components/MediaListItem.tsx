import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Play } from 'lucide-react-native';
import { Text } from './ui/Text';
import { colors } from '../lib/theme/colors';
import type { MediaItemDisplay } from '../lib/hooks';
import {
    getDisplayTitle,
    getMediaTypeForFilter,
    formatDurationShort,
} from '../lib/utils/media';

interface MediaListItemProps {
    item: MediaItemDisplay;
    onPress?: () => void;
}

function getMediaTypeIcon(mediaUrl: string): keyof typeof Ionicons.glyphMap {
    const type = getMediaTypeForFilter({ mediaUrl });
    switch (type) {
        case 'video':
            return 'videocam-outline';
        case 'audio':
            return 'musical-notes-outline';
        case 'image':
            return 'image-outline';
        default:
            return 'document-outline';
    }
}

/** Format date to readable string */
function formatDate(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString();
}

export function MediaListItem({ item, onPress }: MediaListItemProps) {
    const title = getDisplayTitle(item);
    const iconName = getMediaTypeIcon(item.mediaUrl);

    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center gap-4 p-4 rounded-xl bg-zinc-800 active:opacity-90"
        >
            <View className="w-12 h-12 rounded-lg bg-zinc-700 items-center justify-center">
                <Ionicons name={iconName} size={24} color={colors.primaryHex} />
            </View>
            <View className="flex-1 min-w-0">
                <Text
                    className="text-base font-sans-medium text-white"
                    numberOfLines={1}
                >
                    {title}
                </Text>
                <Text className="text-sm text-zinc-400" numberOfLines={1}>
                    {item.playlistNames.join(', ')}
                </Text>
            </View>
            <View className="items-end">
                <Text className="text-sm text-zinc-400">
                    {formatDurationShort(item.duration)}
                </Text>
                <Text className="text-xs text-zinc-500">
                    {formatDate(item.createdAt)}
                </Text>
            </View>
            <Play size={18} color={colors.primaryHex} />
        </Pressable>
    );
}
