import { FlatList, View } from 'react-native';
import { MediaCover } from './MediaCover';
import { Text } from './ui/Text';
import type { MediaSession, Playlist, PlaylistItem } from '../lib/api/types';
import { getDisplayTitle } from '../lib/utils/media';

interface ControlLoadedPlaylistProps {
    assignedPlaylist: Playlist;
    session: Pick<MediaSession, 'mediaUrl'> | null;
}

function getItemTitle(item: PlaylistItem): string {
    return getDisplayTitle({
        mediaUrl: item.mediaUrl,
        title: item.title ?? undefined,
    });
}

function PlaylistItemRow({
    item,
    index,
    isPlaying,
}: {
    item: PlaylistItem;
    index: number;
    isPlaying: boolean;
}) {
    return (
        <View
            className={`flex-row items-center px-4 py-3 gap-3 ${
                index > 0 ? 'border-t border-zinc-700/60' : ''
            } ${isPlaying ? 'bg-zinc-700/40' : ''}`}
        >
            <View className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                <MediaCover mediaUrl={item.mediaUrl} fallbackSize="sm" />
            </View>
            <View className="flex-1">
                <Text
                    className={`font-sans-medium text-sm ${
                        isPlaying ? 'text-approve' : 'text-white'
                    }`}
                    numberOfLines={1}
                >
                    {getItemTitle(item)}
                </Text>
                {isPlaying && (
                    <Text className="text-approve text-xs mt-0.5">
                        Now playing
                    </Text>
                )}
            </View>
        </View>
    );
}

/** Virtualized playlist items for the device control screen. */
export function ControlLoadedPlaylist({
    assignedPlaylist,
    session,
}: ControlLoadedPlaylistProps) {
    const items = assignedPlaylist.items ?? [];

    return (
        <View className="rounded-xl bg-zinc-800 overflow-hidden">
            <View className="px-4 py-3 border-b border-zinc-700">
                <Text className="font-sans-semibold text-white">
                    {assignedPlaylist.name}
                </Text>
                <Text className="text-zinc-400 text-sm mt-0.5">
                    {items.length}{' '}
                    {items.length === 1 ? 'item' : 'items'}
                </Text>
            </View>
            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 208 }}
                nestedScrollEnabled
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={5}
                removeClippedSubviews
                renderItem={({ item, index }) => (
                    <PlaylistItemRow
                        item={item}
                        index={index}
                        isPlaying={
                            !!session?.mediaUrl &&
                            session.mediaUrl === item.mediaUrl
                        }
                    />
                )}
            />
        </View>
    );
}
