import { View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Play } from 'lucide-react-native';
import { Text } from './ui/Text';
import { MediaCover } from './MediaCover';
import { colors } from '../lib/theme/colors';
import type { Playlist } from '../lib/api';
import { getFirstItemCoverUrl } from '../lib/utils/media';

interface PlaylistListItemProps {
    playlist: Playlist;
    locationName?: string;
}

/** Format date to readable string */
function formatDate(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString();
}

export function PlaylistListItem({
    playlist,
    locationName,
}: PlaylistListItemProps) {
    const count = playlist.items?.length ?? 0;
    const coverUrl = getFirstItemCoverUrl(playlist.items);
    const date = playlist.updatedAt ?? playlist.createdAt;

    return (
        <Link href={`/playlists/${playlist.id}`} asChild>
            <Pressable className="flex-row items-center gap-4 p-4 rounded-xl bg-zinc-800 active:opacity-90">
                <View className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <MediaCover mediaUrl={coverUrl} fallbackSize="sm" />
                </View>
                <View className="flex-1 min-w-0">
                    <Text
                        className="text-base font-sans-medium text-white"
                        numberOfLines={1}
                    >
                        {playlist.name}
                    </Text>
                    <Text className="text-sm text-zinc-400" numberOfLines={1}>
                        {locationName ?? `${count} ${count === 1 ? 'item' : 'items'}`}
                    </Text>
                </View>
                <View className="items-end">
                    <Text className="text-sm text-zinc-400">
                        {count} {count === 1 ? 'item' : 'items'}
                    </Text>
                    <Text className="text-xs text-zinc-500">{formatDate(date)}</Text>
                </View>
                <Play size={18} color={colors.primaryHex} />
            </Pressable>
        </Link>
    );
}
