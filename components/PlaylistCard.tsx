import { View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Play, ChevronRight } from 'lucide-react-native';
import { Text } from './ui/Text';
import { MediaCover } from './MediaCover';
import { colors } from '../lib/theme/colors';
import type { Playlist, PlaylistItem } from '../lib/api';
import { getDisplayTitle, getFirstItemCoverUrl } from '../lib/utils/media';

interface PlaylistCardProps {
    playlist: Playlist;
    itemCount?: number;
    locationName?: string;
    onMenuPress?: () => void;
}

/** Derive display title from item URL or title */
function getItemTitle(item: PlaylistItem): string {
    if (item.title?.trim()) return item.title;
    return getDisplayTitle({ mediaUrl: item.mediaUrl, title: item.title ?? undefined });
}

/**
 * Playlist card - descriptive layout with highlighted name, item count, location, preview.
 */
export function PlaylistCard({
    playlist,
    itemCount,
    locationName,
    onMenuPress,
}: PlaylistCardProps) {
    const count = itemCount ?? playlist.items?.length ?? 0;
    const firstItem = playlist.items?.[0];
    const coverUrl = getFirstItemCoverUrl(playlist.items);
    const previewLabel = firstItem
        ? getItemTitle(firstItem)
        : count === 0
          ? 'Empty playlist'
          : `${count} ${count === 1 ? 'item' : 'items'}`;

    return (
        <View className="rounded-2xl bg-zinc-800 overflow-hidden shadow-lg">
            {/* Cover / preview area */}
            <View className="h-24 bg-zinc-700/60 overflow-hidden">
                <MediaCover mediaUrl={coverUrl} fallbackSize="md" />
            </View>

            {/* Highlight section: name, item count, location, preview */}
            <View className="rounded-b-2xl bg-zinc-800 p-4">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="px-3 py-1.5 rounded-lg bg-primary/20">
                        <Text className="font-sans-medium text-sm text-primary">
                            {count} {count === 1 ? 'item' : 'items'}
                        </Text>
                    </View>
                    {onMenuPress && (
                        <Pressable
                            onPress={onMenuPress}
                            className="w-9 h-9 rounded-lg items-center justify-center active:opacity-70"
                        >
                            <Ionicons name="ellipsis-horizontal" size={20} color="#a1a1aa" />
                        </Pressable>
                    )}
                </View>
                <View className="flex-row items-center mb-2">
                    <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                        <Play size={20} color={colors.primaryHex} fill={colors.primaryHex} />
                    </View>
                    <Text className="font-sans-semibold text-white text-base flex-1">
                        {playlist.name}
                    </Text>
                </View>
                <View className="gap-1.5">
                    {locationName && (
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="location-outline" size={14} color="#71717a" />
                            <Text className="text-zinc-400 text-sm">
                                {locationName}
                            </Text>
                        </View>
                    )}
                    <View className="flex-row items-start gap-2">
                        <Ionicons name="musical-notes-outline" size={14} color="#71717a" style={{ marginTop: 2 }} />
                        <Text
                            className="text-zinc-400 text-sm flex-1"
                            numberOfLines={1}
                        >
                            {previewLabel}
                        </Text>
                    </View>
                </View>

                {/* Footer - arrow to detail */}
                <View className="flex-row items-center justify-end mt-3">
                    <Link href={`/playlists/${playlist.id}`} asChild>
                        <Pressable className="w-10 h-10 rounded-xl bg-zinc-700 items-center justify-center active:opacity-80">
                            <ChevronRight size={22} color="#ffffff" />
                        </Pressable>
                    </Link>
                </View>
            </View>
        </View>
    );
}
