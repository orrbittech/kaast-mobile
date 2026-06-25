import { useState, useMemo } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    Modal,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    useActiveOrgContext,
    useDevices,
    usePlaylists,
    useMediaItems,
    useDeletePlaylist,
} from '../../../lib/hooks';
import { Text } from '../../../components/ui/Text';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { CreatePlaylistModal } from '../../../components/CreatePlaylistModal';
import { EditPlaylistModal } from '../../../components/EditPlaylistModal';
import { PlaylistCard } from '../../../components/PlaylistCard';
import { PlaylistListItem } from '../../../components/PlaylistListItem';
import { MediaListItem } from '../../../components/MediaListItem';
import { DRAWER_HEADER_HEIGHT } from '../../../lib/constants';
import { colors } from '../../../lib/theme/colors';
import { getUserFriendlyMessage } from '../../../lib/api';
import { usePlaylistCreateStore } from '../../../lib/stores/playlistCreateStore';

/**
 * Playlists page - manage playlists. Duplicates devices layout.
 */
export default function PlaylistsScreen() {
    const insets = useSafeAreaInsets();
    const contentTopPadding = insets.top + DRAWER_HEADER_HEIGHT + 12;

    const { clerkOrgId, org: firstOrg } = useActiveOrgContext();

    const { data: devices } = useDevices(clerkOrgId);
    const {
        data: playlists,
        isLoading,
        error,
        refetch,
        isRefetching,
    } = usePlaylists(clerkOrgId);
    const { data: mediaItems } = useMediaItems(clerkOrgId);
    const deletePlaylist = useDeletePlaylist(clerkOrgId);

    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
    const [menuPlaylist, setMenuPlaylist] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [editPlaylist, setEditPlaylist] = useState<{
        id: string;
        name: string;
    } | null>(null);

    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [playlistFilter, setPlaylistFilter] = useState<'all' | 'active' | 'inactive' | 'empty'>('all');
    const [confirmDelete, setConfirmDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);

    const activePlaylistIds = useMemo(
        () => new Set(devices?.map((d) => d.activePlaylistId).filter(Boolean) ?? []),
        [devices],
    );
    const playlistIdsWithItems = useMemo(
        () =>
            new Set(
                playlists
                    ?.filter((p) => (p.items?.length ?? 0) > 0)
                    .map((p) => p.id) ?? [],
            ),
        [playlists],
    );

    /** Filter playlists by status (active, inactive, empty) */
    const filteredPlaylists = playlists
        ? playlists.filter((playlist) => {
              if (playlistFilter === 'all') return true;
              if (playlistFilter === 'active') return activePlaylistIds.has(playlist.id);
              if (playlistFilter === 'inactive') return !activePlaylistIds.has(playlist.id);
              if (playlistFilter === 'empty') return !playlistIdsWithItems.has(playlist.id);
              return true;
          })
        : [];

    /** Filter media by search query (title, URL, playlist names) */
    const filteredMediaItems = mediaItems
        ? mediaItems.filter((item) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase().trim();
              const title = (item.title ?? '').toLowerCase();
              const url = item.mediaUrl.toLowerCase();
              const playlists = item.playlistNames.join(' ').toLowerCase();
              return (
                  title.includes(q) || url.includes(q) || playlists.includes(q)
              );
          })
        : [];

    const openCreateModal = () => {
        usePlaylistCreateStore.getState().reset();
        setCreateModalVisible(true);
    };

    const openEditModal = (playlist: { id: string; name: string }) => {
        setMenuPlaylist(null);
        setEditPlaylist(playlist);
        setEditingPlaylistId(playlist.id);
        setEditModalVisible(true);
    };

    const handleDelete = (playlist?: { id: string; name: string } | null) => {
        const target = playlist ?? menuPlaylist ?? editPlaylist;
        if (!target) return;
        setConfirmDelete(target);
    };

    const onConfirmDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deletePlaylist.mutateAsync({
                id: confirmDelete.id,
                name: confirmDelete.name,
            });
            setMenuPlaylist(null);
            setEditPlaylist(null);
            setConfirmDelete(null);
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    return (
        <View className="flex-1 bg-base" style={{ paddingTop: contentTopPadding }}>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching && !isLoading}
                        onRefresh={() => refetch()}
                        tintColor={colors.primaryHex}
                    />
                }
            >
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-xl font-sans-semibold text-white">
                        Playlists
                    </Text>
                    <View className="flex-row gap-2 items-center">
                        <Pressable
                            onPress={() => setSearchModalVisible(true)}
                            className="w-10 h-10 rounded-xl bg-zinc-700 items-center justify-center active:opacity-90"
                            accessibilityLabel="Search playlists"
                        >
                            <Ionicons
                                name="search-outline"
                                size={20}
                                color="#ffffff"
                            />
                        </Pressable>
                        <Pressable
                            onPress={() => setFilterModalVisible(true)}
                            className="w-10 h-10 rounded-xl bg-zinc-700 items-center justify-center active:opacity-90"
                            accessibilityLabel="Filter by status"
                        >
                            <Ionicons
                                name="filter-outline"
                                size={20}
                                color="#ffffff"
                            />
                        </Pressable>
                        <Pressable
                            onPress={() =>
                                setViewMode((m) =>
                                    m === 'card' ? 'list' : 'card'
                                )
                            }
                            className="w-10 h-10 rounded-xl bg-zinc-700 items-center justify-center active:opacity-90"
                            accessibilityLabel={
                                viewMode === 'card'
                                    ? 'Switch to list view'
                                    : 'Switch to card view'
                            }
                        >
                            <Ionicons
                                name={
                                    viewMode === 'card'
                                        ? 'list-outline'
                                        : 'grid-outline'
                                }
                                size={20}
                                color="#ffffff"
                            />
                        </Pressable>
                        <Pressable
                            onPress={() => firstOrg && openCreateModal()}
                            disabled={!firstOrg}
                            className={`w-10 h-10 rounded-xl items-center justify-center ${
                                firstOrg
                                    ? 'bg-approve active:opacity-90'
                                    : 'bg-zinc-800 opacity-50'
                            }`}
                            accessibilityLabel="Create playlist"
                        >
                            <Ionicons name="add" size={20} color="#ffffff" />
                        </Pressable>
                    </View>
                </View>

                {!firstOrg && !isLoading && (
                    <View className="py-6 px-4 rounded-xl bg-zinc-800 mb-4">
                        <Text className="text-zinc-400 text-center">
                            Create or join an organization first.
                        </Text>
                    </View>
                )}

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

                {!isLoading && !error && playlists && firstOrg && (
                    <View className="gap-4">
                        {filteredPlaylists.length === 0 ? (
                            <View className="py-12 items-center">
                                <Text className="text-zinc-400 text-center mb-4">
                                    {playlists.length === 0
                                        ? 'No playlists yet. Create one to get started.'
                                        : `No ${playlistFilter === 'all' ? '' : playlistFilter} playlists found.`}
                                </Text>
                                {playlists.length === 0 && (
                                    <Pressable
                                        onPress={openCreateModal}
                                        className="py-3 px-6 rounded-xl bg-approve active:opacity-90"
                                    >
                                        <Text className="font-sans-medium text-white">
                                            Create Playlist
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        ) : viewMode === 'card' ? (
                            filteredPlaylists.map((playlist) => (
                                <PlaylistCard
                                    key={playlist.id}
                                    playlist={playlist}
                                    itemCount={playlist.items?.length}
                                    scheduleEndTime={playlist.primarySchedule?.endTime}
                                    onMenuPress={() =>
                                        setMenuPlaylist({
                                            id: playlist.id,
                                            name: playlist.name,
                                        })
                                    }
                                />
                            ))
                        ) : (
                            filteredPlaylists.map((playlist) => (
                                <PlaylistListItem
                                    key={playlist.id}
                                    playlist={playlist}
                                    locationName={firstOrg?.name ?? 'Organization'}
                                />
                            ))
                        )}
                    </View>
                )}
            </ScrollView>

            <CreatePlaylistModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
            />

            {/* Filter Modal */}
            <Modal
                visible={filterModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <Pressable
                    className="flex-1 bg-black/60 justify-end"
                    onPress={() => setFilterModalVisible(false)}
                >
                    <Pressable
                        className="bg-zinc-800 rounded-t-2xl p-6 pb-12"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-lg font-sans-semibold text-white mb-4">
                            Filter by status
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            {(['all', 'active', 'inactive', 'empty'] as const).map((opt) => (
                                <Pressable
                                    key={opt}
                                    onPress={() => {
                                        setPlaylistFilter(opt);
                                        setFilterModalVisible(false);
                                    }}
                                    className={`px-4 py-3 rounded-xl ${
                                        playlistFilter === opt ? 'bg-approve' : 'bg-zinc-700'
                                    }`}
                                >
                                    <Text className="font-sans-medium text-white capitalize">
                                        {opt}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Search Modal */}
            <Modal
                visible={searchModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSearchModalVisible(false)}
            >
                <Pressable
                    className="flex-1 bg-black/60 justify-center items-center px-6"
                    onPress={() => setSearchModalVisible(false)}
                >
                    <Pressable
                        className="w-full max-w-md max-h-[80%] rounded-2xl bg-zinc-800 p-6"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-lg font-sans-semibold text-white mb-4">
                            Search Media
                        </Text>
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search by name, URL, or playlist..."
                            placeholderTextColor="#71717a"
                            style={{ fontFamily: 'Urbanist_400Regular' }}
                            className="bg-zinc-700 rounded-xl px-4 py-3 text-white mb-4"
                            autoFocus
                        />
                        <ScrollView
                            className="mb-4"
                            style={{
                                maxHeight: Math.min(400, Dimensions.get('window').height * 0.5),
                            }}
                            contentContainerStyle={{ paddingBottom: 8 }}
                            showsVerticalScrollIndicator
                            nestedScrollEnabled
                            bounces
                        >
                            <View className="gap-2">
                                {filteredMediaItems.length === 0 ? (
                                    <Text className="text-zinc-400 text-center py-4">
                                        {searchQuery.trim()
                                            ? 'No media found.'
                                            : 'Type to search.'}
                                    </Text>
                                ) : (
                                    filteredMediaItems.map((item) => (
                                        <MediaListItem
                                            key={item.id}
                                            item={item}
                                        />
                                    ))
                                )}
                            </View>
                        </ScrollView>
                        <Pressable
                            onPress={() => setSearchModalVisible(false)}
                            className="py-3 rounded-xl bg-primary items-center active:opacity-90"
                        >
                            <Text className="font-sans-medium text-white">
                                Close
                            </Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>

            <EditPlaylistModal
                visible={editModalVisible}
                playlistId={editingPlaylistId}
                onClose={() => {
                    setEditModalVisible(false);
                    setEditingPlaylistId(null);
                    setEditPlaylist(null);
                }}
            />

            {/* Playlist menu (bottom sheet) */}
            {menuPlaylist && !editModalVisible && (
                <Modal
                    visible={!!menuPlaylist}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setMenuPlaylist(null)}
                >
                    <Pressable
                        className="flex-1 bg-black/60 justify-end"
                        onPress={() => setMenuPlaylist(null)}
                    >
                        <Pressable
                            className="bg-zinc-800 rounded-t-2xl p-6 pb-12"
                            onPress={(e) => e.stopPropagation()}
                        >
                            <Text className="text-zinc-400 text-sm mb-4">
                                {menuPlaylist.name}
                            </Text>
                            <Pressable
                                onPress={() => {
                                    if (menuPlaylist)
                                        openEditModal(menuPlaylist);
                                    setMenuPlaylist(null);
                                }}
                                className="flex-row items-center gap-3 py-4 border-b border-zinc-700"
                            >
                                <Ionicons
                                    name="pencil-outline"
                                    size={22}
                                    color="#ffffff"
                                />
                                <Text className="font-sans-medium text-white">
                                    Edit
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    const playlist = menuPlaylist;
                                    setMenuPlaylist(null);
                                    handleDelete(playlist);
                                }}
                                className="flex-row items-center gap-3 py-4"
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={22}
                                    color={colors.primaryHex}
                                />
                                <Text className="font-sans-medium text-primary">
                                    Delete
                                </Text>
                            </Pressable>
                        </Pressable>
                    </Pressable>
                </Modal>
            )}

            <ConfirmModal
                visible={!!confirmDelete}
                title="Delete Playlist"
                message={
                    confirmDelete
                        ? `Remove "${confirmDelete.name}"? This cannot be undone.`
                        : ''
                }
                confirmText="Delete"
                cancelText="Cancel"
                confirmStyle="destructive"
                onConfirm={onConfirmDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </View>
    );
}
