import { useState } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    Modal,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    usePlaylist,
    useDeletePlaylist,
    useAddPlaylistItem,
    useRemovePlaylistItem,
    useMediaItems,
    useActiveOrgContext,
    usePlaylistDeviceStats,
    usePausePlaylistOnAllDevices,
    useResumePlaylistOnAllDevices,
} from '../../../lib/hooks';
import { EditPlaylistModal } from '../../../components/EditPlaylistModal';
import { deviceKeys, mediaSessionKeys } from '../../../lib/api';
import { Text } from '../../../components/ui/Text';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { MediaListItem } from '../../../components/MediaListItem';
import { MediaCover } from '../../../components/MediaCover';
import { PlaylistStatsCharts } from '../../../components/PlaylistStatsCharts';
import { PlaylistDevicesSection } from '../../../components/PlaylistDevicesSection';
import { PlaylistSchedulesSection } from '../../../components/PlaylistSchedulesSection';
import { DRAWER_HEADER_HEIGHT } from '../../../lib/constants';
import { colors } from '../../../lib/theme/colors';
import { getUserFriendlyMessage } from '../../../lib/api';
import { getDisplayTitle, getMediaTypeForFilter } from '../../../lib/utils/media';

function getItemTitle(item: { mediaUrl: string; title?: string | null }): string {
    return getDisplayTitle({
        mediaUrl: item.mediaUrl,
        title: item.title ?? undefined,
    });
}

/**
 * Playlist detail - show items, edit, delete, add item.
 */
export default function PlaylistDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const contentTopPadding = insets.top + DRAWER_HEADER_HEIGHT + 24;

    const {
        data: playlist,
        isLoading,
        error,
        refetch,
        isRefetching,
    } = usePlaylist(id);
    const { clerkOrgId, locations } = useActiveOrgContext();
    const { data: mediaItems } = useMediaItems(clerkOrgId);
    const deviceStats = usePlaylistDeviceStats(id, clerkOrgId, playlist?.items);
    const deletePlaylist = useDeletePlaylist(playlist?.clerkOrgId);
    const addItem = useAddPlaylistItem(id, playlist?.clerkOrgId);
    const removeItem = useRemovePlaylistItem(id, playlist?.clerkOrgId);
    const pauseAll = usePausePlaylistOnAllDevices(id);
    const resumeAll = useResumePlaylistOnAllDevices(id);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [menuItem, setMenuItem] = useState<{
        id: string;
        mediaUrl: string;
        title?: string | null;
    } | null>(null);
    const [confirmDeletePlaylist, setConfirmDeletePlaylist] = useState(false);
    const [confirmRemoveItem, setConfirmRemoveItem] = useState<{
        id: string;
        mediaUrl: string;
        title?: string | null;
    } | null>(null);

    const handleDelete = () => {
        if (!playlist) return;
        setConfirmDeletePlaylist(true);
    };

    const onConfirmDeletePlaylist = async () => {
        if (!playlist) return;
        try {
            await deletePlaylist.mutateAsync({
                id: playlist.id,
                name: playlist.name,
            });
            setConfirmDeletePlaylist(false);
            router.back();
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const handleAddFromLibrary = async (media: { id: string; title?: string }) => {
        try {
            await addItem.mutateAsync({
                mediaId: media.id,
            });
            setAddModalVisible(false);
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const playlistMediaIds = new Set(
        playlist?.items?.map((item) => item.mediaId) ?? [],
    );
    const libraryItems =
        mediaItems?.filter((item) => !playlistMediaIds.has(item.id)) ?? [];

    const handleRemoveItem = (item: { id: string; mediaUrl: string; title?: string | null }) => {
        setMenuItem(null);
        setConfirmRemoveItem(item);
    };

    const onConfirmRemoveItem = async () => {
        if (!confirmRemoveItem) return;
        try {
            await removeItem.mutateAsync(confirmRemoveItem.id);
            setConfirmRemoveItem(null);
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const openEditModal = () => {
        if (playlist) {
            setEditModalVisible(true);
        }
    };

    const handleRefresh = async () => {
        await refetch();
        if (clerkOrgId) {
            await queryClient.invalidateQueries({
                queryKey: deviceKeys.list(clerkOrgId),
            });
        }
        await queryClient.invalidateQueries({ queryKey: mediaSessionKeys.all });
    };

    if (!id) {
        return (
            <View className="flex-1 bg-base items-center justify-center">
                <Text className="text-zinc-400">Invalid playlist</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-base" style={{ paddingTop: contentTopPadding }}>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching && !isLoading}
                        onRefresh={() => void handleRefresh()}
                        tintColor={colors.primaryHex}
                    />
                }
            >
                {isLoading && (
                    <View className="py-12 items-center">
                        <ActivityIndicator size="large" color={colors.primaryHex} />
                    </View>
                )}

                {error && (
                    <View className="py-6 px-4 rounded-xl bg-zinc-800 mb-4">
                        <Text className="text-primary font-sans-medium mb-2">
                            {getUserFriendlyMessage(error)}
                        </Text>
                        <Pressable
                            onPress={() => refetch()}
                            className="self-start py-2 px-4 rounded-lg bg-zinc-700"
                        >
                            <Text className="text-white font-sans-medium">
                                Retry
                            </Text>
                        </Pressable>
                    </View>
                )}

                {!isLoading && !error && playlist && (
                    <>
                        {/* Page header: title and icon-only action buttons on same row */}
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-xl font-sans-semibold text-white flex-1">
                                {playlist.name}
                            </Text>
                            <View className="flex-row items-center gap-2">
                                {deviceStats.assignedDevices.length > 0 ? (
                                    <>
                                        <Pressable
                                            onPress={() => pauseAll.mutate()}
                                            disabled={pauseAll.isPending}
                                            className="w-10 h-10 rounded-lg bg-zinc-700 items-center justify-center active:opacity-80"
                                            accessibilityLabel="Pause on all devices"
                                        >
                                            {pauseAll.isPending ? (
                                                <ActivityIndicator size="small" color="#a1a1aa" />
                                            ) : (
                                                <Ionicons
                                                    name="pause-circle-outline"
                                                    size={22}
                                                    color="#a1a1aa"
                                                />
                                            )}
                                        </Pressable>
                                        <Pressable
                                            onPress={() => resumeAll.mutate()}
                                            disabled={resumeAll.isPending}
                                            className="w-10 h-10 rounded-lg bg-zinc-700 items-center justify-center active:opacity-80"
                                            accessibilityLabel="Resume on all devices"
                                        >
                                            {resumeAll.isPending ? (
                                                <ActivityIndicator size="small" color="#a1a1aa" />
                                            ) : (
                                                <Ionicons
                                                    name="play-circle-outline"
                                                    size={22}
                                                    color="#16a34a"
                                                />
                                            )}
                                        </Pressable>
                                    </>
                                ) : null}
                                <Pressable
                                    onPress={openEditModal}
                                    className="w-10 h-10 rounded-lg bg-zinc-700 items-center justify-center active:opacity-80"
                                    accessibilityLabel="Edit playlist"
                                >
                                    <Ionicons
                                        name="pencil-outline"
                                        size={22}
                                        color="#a1a1aa"
                                    />
                                </Pressable>
                                <Pressable
                                    onPress={() => setAddModalVisible(true)}
                                    className="w-10 h-10 rounded-lg bg-approve items-center justify-center active:opacity-90"
                                    accessibilityLabel="Add item"
                                >
                                    <Ionicons name="add" size={22} color="#ffffff" />
                                </Pressable>
                                <Pressable
                                    onPress={handleDelete}
                                    className="w-10 h-10 rounded-lg items-center justify-center active:opacity-70"
                                    accessibilityLabel="Delete playlist"
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={22}
                                        color={colors.primaryHex}
                                    />
                                </Pressable>
                            </View>
                        </View>

                        <PlaylistStatsCharts
                            stats={deviceStats}
                            isLoading={deviceStats.isLoading}
                        />

                        <PlaylistDevicesSection
                            devices={deviceStats.assignedDevices}
                            locations={locations}
                        />

                        <PlaylistSchedulesSection playlistId={playlist.id} />

                        <Text className="text-zinc-400 text-sm mb-3 mt-8">
                            Items ({playlist.items?.length ?? 0})
                        </Text>
                        <View className="gap-3">
                            {playlist.items?.length === 0 ? (
                                <View className="py-8 px-4 rounded-xl bg-zinc-800 items-center">
                                    <Text className="text-zinc-400 text-center mb-4">
                                        No items yet. Add media to get started.
                                    </Text>
                                    <Pressable
                                        onPress={() => setAddModalVisible(true)}
                                        className="py-3 px-6 rounded-xl bg-approve active:opacity-90"
                                    >
                                        <Text className="font-sans-medium text-white">
                                            Add Item
                                        </Text>
                                    </Pressable>
                                </View>
                            ) : (
                                playlist.items?.map((item, index) => (
                                    <Pressable
                                        key={item.id}
                                        onPress={() =>
                                            openEditItemModal({
                                                id: item.id,
                                                mediaUrl: item.mediaUrl,
                                                title: item.title,
                                            })
                                        }
                                        className="rounded-xl bg-zinc-800 p-4 flex-row items-center justify-between active:opacity-95"
                                    >
                                        <View className="w-14 h-14 rounded-lg bg-zinc-700 mr-4 overflow-hidden shrink-0">
                                            <MediaCover
                                                mediaUrl={item.mediaUrl}
                                                fallbackSize="sm"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-sans-medium text-white">
                                                {getItemTitle(item)}
                                            </Text>
                                            <Text className="text-zinc-400 text-sm mt-1 capitalize">
                                                {index + 1}. {getMediaTypeForFilter(item)}
                                            </Text>
                                        </View>
                                        <Pressable
                                            onPress={() =>
                                                setMenuItem({
                                                    id: item.id,
                                                    mediaUrl: item.mediaUrl,
                                                    title: item.title,
                                                })
                                            }
                                            className="w-9 h-9 rounded-lg items-center justify-center active:opacity-70"
                                        >
                                            <Ionicons
                                                name="ellipsis-horizontal"
                                                size={20}
                                                color="#a1a1aa"
                                            />
                                        </Pressable>
                                    </Pressable>
                                ))
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

            <EditPlaylistModal
                visible={editModalVisible}
                playlistId={id ?? null}
                onClose={() => setEditModalVisible(false)}
            />

            {/* Add Item Modal */}
            <Modal
                visible={addModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setAddModalVisible(false)}
            >
                <Pressable
                    className="flex-1 bg-black/60 justify-center items-center px-6"
                    onPress={() => setAddModalVisible(false)}
                >
                    <Pressable
                        className="w-full max-w-md rounded-2xl bg-zinc-800 p-6 max-h-[85%]"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-lg font-sans-semibold text-white mb-4">
                            Add from library
                        </Text>
                        <ScrollView className="max-h-80 mb-4">
                            {libraryItems.length === 0 ? (
                                <View className="py-8 items-center">
                                    <Text className="text-zinc-400 text-center">
                                        No other media in your library yet. Add media from
                                        the Media tab first.
                                    </Text>
                                </View>
                            ) : (
                                <View className="gap-2">
                                    {libraryItems.map((item) => (
                                        <MediaListItem
                                            key={item.id}
                                            item={item}
                                            onPress={() => handleAddFromLibrary(item)}
                                        />
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                        <Pressable
                            onPress={() => setAddModalVisible(false)}
                            className="py-3 rounded-xl bg-zinc-700 items-center"
                        >
                            <Text className="font-sans-medium text-white">
                                Cancel
                            </Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Item menu */}
            {menuItem && (
                <Modal
                    visible={!!menuItem}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setMenuItem(null)}
                >
                    <Pressable
                        className="flex-1 bg-black/60 justify-end"
                        onPress={() => setMenuItem(null)}
                    >
                        <Pressable
                            className="bg-zinc-800 rounded-t-2xl p-6 pb-12"
                            onPress={(e) => e.stopPropagation()}
                        >
                            <Text className="text-zinc-400 text-sm mb-4">
                                {getItemTitle(menuItem)}
                            </Text>
                            <Pressable
                                onPress={() => handleRemoveItem(menuItem)}
                                className="flex-row items-center gap-3 py-4"
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={22}
                                    color={colors.primaryHex}
                                />
                                <Text className="font-sans-medium text-primary">
                                    Remove from playlist
                                </Text>
                            </Pressable>
                        </Pressable>
                    </Pressable>
                </Modal>
            )}

            <ConfirmModal
                visible={confirmDeletePlaylist}
                title="Delete Playlist"
                message={
                    playlist
                        ? `Remove "${playlist.name}"? This cannot be undone.`
                        : ''
                }
                confirmText="Delete"
                cancelText="Cancel"
                confirmStyle="destructive"
                onConfirm={onConfirmDeletePlaylist}
                onCancel={() => setConfirmDeletePlaylist(false)}
            />

            <ConfirmModal
                visible={!!confirmRemoveItem}
                title="Remove Item"
                message={
                    confirmRemoveItem
                        ? `Remove "${getItemTitle(confirmRemoveItem)}" from playlist?`
                        : ''
                }
                confirmText="Remove"
                cancelText="Cancel"
                confirmStyle="destructive"
                onConfirm={onConfirmRemoveItem}
                onCancel={() => setConfirmRemoveItem(null)}
            />
        </View>
    );
}
