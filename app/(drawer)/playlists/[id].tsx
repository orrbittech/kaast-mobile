import { useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Play } from 'lucide-react-native';
import {
    usePlaylist,
    useUpdatePlaylist,
    useDeletePlaylist,
    useAddPlaylistItem,
    useUpdatePlaylistItem,
    useRemovePlaylistItem,
} from '../../../lib/hooks';
import { Text } from '../../../components/ui/Text';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { DRAWER_HEADER_HEIGHT } from '../../../lib/constants';
import { colors } from '../../../lib/theme/colors';
import { getUserFriendlyMessage } from '../../../lib/api';
import { isImageUrl, getDisplayTitle } from '../../../lib/utils/media';

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
    const insets = useSafeAreaInsets();
    const contentTopPadding = insets.top + DRAWER_HEADER_HEIGHT + 24;

    const {
        data: playlist,
        isLoading,
        error,
        refetch,
        isRefetching,
    } = usePlaylist(id);
    const updatePlaylist = useUpdatePlaylist(playlist?.clerkOrgId);
    const deletePlaylist = useDeletePlaylist(playlist?.clerkOrgId);
    const addItem = useAddPlaylistItem(id, playlist?.clerkOrgId);
    const updatePlaylistItem = useUpdatePlaylistItem(id, playlist?.clerkOrgId);
    const removeItem = useRemovePlaylistItem(id, playlist?.clerkOrgId);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editItemModalVisible, setEditItemModalVisible] = useState(false);
    const [editItem, setEditItem] = useState<{
        id: string;
        mediaUrl: string;
        title?: string | null;
    } | null>(null);
    const [editItemTitle, setEditItemTitle] = useState('');
    const [editItemUrl, setEditItemUrl] = useState('');
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [addMediaUrl, setAddMediaUrl] = useState('');
    const [addTitle, setAddTitle] = useState('');
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

    const handleEdit = async () => {
        if (!playlist || !editName.trim()) return;
        try {
            await updatePlaylist.mutateAsync({
                id: playlist.id,
                body: { name: editName.trim() },
            });
            setEditModalVisible(false);
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const handleDelete = () => {
        if (!playlist) return;
        setConfirmDeletePlaylist(true);
    };

    const onConfirmDeletePlaylist = async () => {
        if (!playlist) return;
        try {
            await deletePlaylist.mutateAsync(playlist.id);
            setConfirmDeletePlaylist(false);
            router.back();
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const handleAddItem = async () => {
        if (!addMediaUrl.trim()) return;
        try {
            await addItem.mutateAsync({
                mediaUrl: addMediaUrl.trim(),
                title: addTitle.trim() || undefined,
            });
            setAddModalVisible(false);
            setAddMediaUrl('');
            setAddTitle('');
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const openEditItemModal = (item: {
        id: string;
        mediaUrl: string;
        title?: string | null;
    }) => {
        setMenuItem(null);
        setEditItem(item);
        setEditItemTitle(item.title ?? '');
        setEditItemUrl(item.mediaUrl);
        setEditItemModalVisible(true);
    };

    const handleEditItem = async () => {
        if (!editItem || !editItemUrl.trim()) return;
        try {
            await updatePlaylistItem.mutateAsync({
                itemId: editItem.id,
                body: {
                    mediaUrl: editItemUrl.trim(),
                    title: editItemTitle.trim() || null,
                },
            });
            setEditItemModalVisible(false);
            setEditItem(null);
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

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
            setEditName(playlist.name);
            setEditModalVisible(true);
        }
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
                        onRefresh={() => refetch()}
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

                        <Text className="text-zinc-400 text-sm mb-3">
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
                                            {isImageUrl(item.mediaUrl) ? (
                                                <Image
                                                    source={{ uri: item.mediaUrl }}
                                                    className="w-full h-full"
                                                    contentFit="cover"
                                                />
                                            ) : (
                                                <View className="flex-1 items-center justify-center">
                                                    <Play size={24} color="#71717a" />
                                                </View>
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-sans-medium text-white">
                                                {getItemTitle(item)}
                                            </Text>
                                            <Text className="text-zinc-400 text-sm mt-1" numberOfLines={1}>
                                                {index + 1}. {item.mediaUrl}
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

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <Pressable
                    className="flex-1 bg-black/60 justify-center items-center px-6"
                    onPress={() => setEditModalVisible(false)}
                >
                    <Pressable
                        className="w-full max-w-md rounded-2xl bg-zinc-800 p-6"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-lg font-sans-semibold text-white mb-4">
                            Edit Playlist
                        </Text>
                        <Text className="text-zinc-400 text-sm mb-2">Name</Text>
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Playlist name"
                            placeholderTextColor="#71717a"
                            style={{ fontFamily: 'Urbanist_400Regular' }}
                            className="bg-zinc-700 rounded-xl px-4 py-3 text-white mb-6"
                        />
                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={() => setEditModalVisible(false)}
                                className="flex-1 py-3 rounded-xl bg-primary items-center"
                            >
                                <Text className="font-sans-medium text-white">
                                    Cancel
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={handleEdit}
                                disabled={
                                    !editName.trim() || updatePlaylist.isPending
                                }
                                className="flex-1 py-3 rounded-xl bg-approve items-center disabled:opacity-50"
                            >
                                {updatePlaylist.isPending ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#ffffff"
                                    />
                                ) : (
                                    <Text className="font-sans-medium text-white">
                                        Save
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

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
                        className="w-full max-w-md rounded-2xl bg-zinc-800 p-6"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-lg font-sans-semibold text-white mb-4">
                            Add Media Item
                        </Text>
                        <KeyboardAvoidingView
                            behavior={
                                Platform.OS === 'ios' ? 'padding' : undefined
                            }
                        >
                            <Text className="text-zinc-400 text-sm mb-2">
                                Media URL
                            </Text>
                            <TextInput
                                value={addMediaUrl}
                                onChangeText={setAddMediaUrl}
                                placeholder="https://..."
                                placeholderTextColor="#71717a"
                                style={{ fontFamily: 'Urbanist_400Regular' }}
                                className="bg-zinc-700 rounded-xl px-4 py-3 text-white mb-4"
                            />
                            <Text className="text-zinc-400 text-sm mb-2">
                                Title (optional)
                            </Text>
                            <TextInput
                                value={addTitle}
                                onChangeText={setAddTitle}
                                placeholder="Display name"
                                placeholderTextColor="#71717a"
                                style={{ fontFamily: 'Urbanist_400Regular' }}
                                className="bg-zinc-700 rounded-xl px-4 py-3 text-white mb-6"
                            />
                        </KeyboardAvoidingView>
                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={() => setAddModalVisible(false)}
                                className="flex-1 py-3 rounded-xl bg-primary items-center"
                            >
                                <Text className="font-sans-medium text-white">
                                    Cancel
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={handleAddItem}
                                disabled={
                                    !addMediaUrl.trim() || addItem.isPending
                                }
                                className="flex-1 py-3 rounded-xl bg-approve items-center disabled:opacity-50"
                            >
                                {addItem.isPending ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#ffffff"
                                    />
                                ) : (
                                    <Text className="font-sans-medium text-white">
                                        Add
                                    </Text>
                                )}
                            </Pressable>
                        </View>
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
                                onPress={() => openEditItemModal(menuItem)}
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

            {/* Edit Item Modal */}
            <Modal
                visible={editItemModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setEditItemModalVisible(false)}
            >
                <Pressable
                    className="flex-1 bg-black/60 justify-center items-center px-6"
                    onPress={() => setEditItemModalVisible(false)}
                >
                    <Pressable
                        className="w-full max-w-md rounded-2xl bg-zinc-800 p-6"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-lg font-sans-semibold text-white mb-4">
                            Edit Media Item
                        </Text>
                        <KeyboardAvoidingView
                            behavior={
                                Platform.OS === 'ios' ? 'padding' : undefined
                            }
                        >
                            <Text className="text-zinc-400 text-sm mb-2">
                                Title (optional)
                            </Text>
                            <TextInput
                                value={editItemTitle}
                                onChangeText={setEditItemTitle}
                                placeholder="Display name"
                                placeholderTextColor="#71717a"
                                style={{ fontFamily: 'Urbanist_400Regular' }}
                                className="bg-zinc-700 rounded-xl px-4 py-3 text-white mb-4"
                            />
                            <Text className="text-zinc-400 text-sm mb-2">
                                Media URL
                            </Text>
                            <TextInput
                                value={editItemUrl}
                                onChangeText={setEditItemUrl}
                                placeholder="https://..."
                                placeholderTextColor="#71717a"
                                style={{ fontFamily: 'Urbanist_400Regular' }}
                                className="bg-zinc-700 rounded-xl px-4 py-3 text-white mb-6"
                            />
                        </KeyboardAvoidingView>
                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={() => setEditItemModalVisible(false)}
                                className="flex-1 py-3 rounded-xl bg-zinc-700 items-center"
                            >
                                <Text className="font-sans-medium text-white">
                                    Cancel
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={handleEditItem}
                                disabled={
                                    !editItemUrl.trim() ||
                                    updatePlaylistItem.isPending
                                }
                                className="flex-1 py-3 rounded-xl bg-approve items-center disabled:opacity-50"
                            >
                                {updatePlaylistItem.isPending ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#ffffff"
                                    />
                                ) : (
                                    <Text className="font-sans-medium text-white">
                                        Save
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

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
