import { View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Play, ChevronRight } from 'lucide-react-native';
import { Text } from './ui/Text';
import { MediaCover } from './MediaCover';
import { colors } from '../lib/theme/colors';
import type { Playlist } from '../lib/api';
import { getFirstItemCoverUrl } from '../lib/utils/media';
import {
    formatPlaylistStats,
    formatUntilTime,
    getPlaylistTotalDurationSeconds,
} from '../lib/utils/playlist';

interface PlaylistCardProps {
    playlist: Playlist;
    itemCount?: number;
    scheduleEndTime?: string | null;
    onMenuPress?: () => void;
}

/**
 * Playlist card - compact layout with stats, schedule end time, and inline detail link.
 */
export function PlaylistCard({
    playlist,
    itemCount,
    scheduleEndTime,
    onMenuPress,
}: PlaylistCardProps) {
    const count = itemCount ?? playlist.items?.length ?? 0;
    const coverUrl = getFirstItemCoverUrl(playlist.items);
    const totalDurationSeconds = getPlaylistTotalDurationSeconds(playlist.items);
    const statsLabel = formatPlaylistStats(count, totalDurationSeconds);
    const untilLabel = formatUntilTime(
        scheduleEndTime ?? playlist.primarySchedule?.endTime,
    );

    return (
        <View className="rounded-2xl bg-zinc-800 overflow-hidden shadow-lg">
            <View className="h-20 bg-zinc-700/60 overflow-hidden">
                <MediaCover mediaUrl={coverUrl} fallbackSize="md" />
            </View>

            <View className="rounded-b-2xl bg-zinc-800 p-4">
                {onMenuPress ? (
                    <View className="flex-row items-center justify-end mb-2">
                        <Pressable
                            onPress={onMenuPress}
                            className="w-9 h-9 rounded-lg items-center justify-center active:opacity-70"
                        >
                            <Ionicons name="ellipsis-horizontal" size={20} color="#a1a1aa" />
                        </Pressable>
                    </View>
                ) : null}

                <View className="flex-row items-center mb-2">
                    <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                        <Play size={20} color={colors.primaryHex} fill={colors.primaryHex} />
                    </View>
                    <Text className="font-sans-semibold text-white text-base flex-1">
                        {playlist.name}
                    </Text>
                </View>

                <View className="gap-1.5">
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="list-outline" size={14} color="#71717a" />
                        <Text className="text-zinc-400 text-sm flex-1" numberOfLines={1}>
                            {statsLabel}
                        </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                        <Ionicons name="time-outline" size={14} color="#71717a" />
                        <Text className="text-zinc-400 text-sm flex-1" numberOfLines={1}>
                            {untilLabel}
                        </Text>
                        <Link href={`/playlists/${playlist.id}`} asChild>
                            <Pressable className="w-10 h-10 rounded-xl bg-zinc-700 items-center justify-center active:opacity-80">
                                <ChevronRight size={22} color="#ffffff" />
                            </Pressable>
                        </Link>
                    </View>
                </View>
            </View>
        </View>
    );
}
