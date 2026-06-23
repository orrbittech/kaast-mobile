import { useState } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    Modal,
    TextInput,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
    useActiveOrgContext,
    useDevice,
    useUpdateDevice,
    useDeleteDevice,
    usePlaylists,
} from '../../../lib/hooks';
import { Text } from '../../../components/ui/Text';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { DRAWER_HEADER_HEIGHT } from '../../../lib/constants';
import { colors } from '../../../lib/theme/colors';
import { getStatusBadgeClasses } from '../../../lib/utils/device-status';
import { isImageUrl, formatDurationShort } from '../../../lib/utils/media';
function formatDate(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString();
}

/** Format lastSeenAt to relative time */
function formatLastSeen(lastSeenAt?: string): string {
    if (!lastSeenAt) return 'Never';
    const date = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * Device detail - full device info including media session.
 */
export default function DeviceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const contentTopPadding = insets.top + DRAWER_HEADER_HEIGHT + 24;

    const { clerkOrgId, locations } = useActiveOrgContext();

    const {
        data: device,
        isLoading,
        error,
        refetch,
        isRefetching,
    } = useDevice(id);
    const updateDevice = useUpdateDevice(clerkOrgId);
    const deleteDevice = useDeleteDevice(clerkOrgId);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editLocationId, setEditLocationId] = useState<string | null>(null);
    const [editActivePlaylistId, setEditActivePlaylistId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const locationName =
        locations?.find((l) => l.id === device?.locationId)?.name ?? 'Unassigned';

    const { data: playlists } = usePlaylists(clerkOrgId ?? undefined);

    const handleEdit = async () => {
        if (!device || !editName.trim()) return;
        try {
            await updateDevice.mutateAsync({
                id: device.id,
                body: {
                    name: editName.trim(),
                    locationId: editLocationId,
                    activePlaylistId: editActivePlaylistId,
                },
            });
            setEditModalVisible(false);
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const handleDelete = () => {
        if (!device) return;
        setConfirmDelete(true);
    };

    const onConfirmDelete = async () => {
        if (!device) return;
        try {
            await deleteDevice.mutateAsync(device.id);
            setConfirmDelete(false);
            router.back();
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const openEditModal = () => {
        if (device) {
            setEditName(device.name);
            setEditLocationId(device.locationId ?? null);
            setEditActivePlaylistId(device.activePlaylistId ?? null);
            setEditModalVisible(true);
        }
    };

    if (isLoading) {
        return (
            <View
                className="flex-1 bg-base justify-center items-center"
                style={{ paddingTop: contentTopPadding }}
            >
                <ActivityIndicator size="large" color={colors.primaryHex} />
            </View>
        );
    }

    if (error || !device) {
        return (
            <View
                className="flex-1 bg-base justify-center items-center px-6"
                style={{ paddingTop: contentTopPadding }}
            >
                <Text className="text-zinc-400 text-center mb-4">
                    Device not found
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    className="py-3 px-6 rounded-xl bg-zinc-700"
                >
                    <Text className="font-sans-medium text-white">Go back</Text>
                </Pressable>
            </View>
        );
    }

    const { bg: statusBg, text: statusText } = getStatusBadgeClasses(device.status);
    const session = device.mediaSession;

    return (
        <View className="flex-1 bg-base" style={{ paddingTop: contentTopPadding }}>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => refetch()}
                        tintColor={colors.primaryHex}
                    />
                }
            >
                {/* Header */}
                <View className="flex-row items-center mb-6">
                    <View className="w-14 h-14 rounded-full bg-primary items-center justify-center mr-4">
                        <Ionicons name="tv-outline" size={28} color="#ffffff" />
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-xl font-sans-semibold text-white flex-1">
                                {device.name}
                            </Text>
                            <View className="flex-row items-center gap-1">
                                <Pressable
                                    onPress={openEditModal}
                                    className="w-10 h-10 rounded-lg items-center justify-center active:opacity-70"
                                    accessibilityLabel="Edit device"
                                >
                                    <Ionicons
                                        name="pencil-outline"
                                        size={22}
                                        color="#a1a1aa"
                                    />
                                </Pressable>
                                <Pressable
                                    onPress={handleDelete}
                                    className="w-10 h-10 rounded-lg items-center justify-center active:opacity-70"
                                    accessibilityLabel="Delete device"
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={22}
                                        color={colors.primaryHex}
                                    />
                                </Pressable>
                            </View>
                        </View>
                        <View
                            className={`self-start mt-2 px-3 py-1.5 rounded-lg ${statusBg}`}
                        >
                            <Text
                                className={`font-sans-medium text-sm capitalize ${statusText}`}
                            >
                                {device.status}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Device info */}
                <View className="rounded-2xl bg-zinc-800 p-4 mb-4">
                    <Text className="text-zinc-400 text-sm font-sans-medium mb-3">
                        Device information
                    </Text>
                    <View className="gap-3">
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-500 text-sm">Name</Text>
                            <Text className="font-sans-medium text-white text-sm">
                                {device.name}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-500 text-sm">Device ID</Text>
                            <Text className="font-sans-medium text-white text-sm">
                                {device.deviceId}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-500 text-sm">Location</Text>
                            <Text className="font-sans-medium text-white text-sm">
                                {locationName}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-500 text-sm">Status</Text>
                            <Text className="font-sans-medium text-white text-sm capitalize">
                                {device.status}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-500 text-sm">Last played</Text>
                            <Text className="font-sans-medium text-white text-sm">
                                {formatLastSeen(device.lastSeenAt)}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-500 text-sm">Current playlist</Text>
                            <Text className="font-sans-medium text-white text-sm">
                                {device.activePlaylist?.name ?? '—'}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-500 text-sm">Creator</Text>
                            <Text className="font-sans-medium text-white text-sm">
                                {device.clerkUserId ?? '—'}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-500 text-sm">Plays</Text>
                            <Text className="font-sans-medium text-white text-sm">—</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-500 text-sm">Liked media</Text>
                            <Text className="font-sans-medium text-white text-sm">—</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-500 text-sm">Approver</Text>
                            <Text className="font-sans-medium text-white text-sm">—</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-500 text-sm">Created</Text>
                            <Text className="font-sans-medium text-white text-sm">
                                {formatDate(device.createdAt)}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-500 text-sm">Updated</Text>
                            <Text className="font-sans-medium text-white text-sm">
                                {formatDate(device.updatedAt)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Media session */}
                {session && (
                    <View className="rounded-2xl bg-zinc-800 overflow-hidden mb-4">
                        {session.mediaUrl && (
                            <View className="h-40 bg-zinc-700">
                                {isImageUrl(session.mediaUrl) ? (
                                    <Image
                                        source={{ uri: session.mediaUrl }}
                                        className="w-full h-full"
                                        contentFit="cover"
                                    />
                                ) : (
                                    <View className="flex-1 items-center justify-center">
                                        <Ionicons name="videocam-outline" size={48} color="#71717a" />
                                        <Text className="text-zinc-500 text-sm mt-2">Video</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        <View className="p-4">
                            <Text className="text-zinc-400 text-sm font-sans-medium mb-3">
                                Media session
                            </Text>
                            <View className="gap-3">
                            <View className="flex-row justify-between">
                                <Text className="text-zinc-500 text-sm">Playing</Text>
                                <Text className="font-sans-medium text-white text-sm">
                                    {session.playing ? 'Yes' : 'No'}
                                </Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-zinc-500 text-sm">Position</Text>
                                <Text className="font-sans-medium text-white text-sm">
                                    {formatDurationShort(session.position)} /{' '}
                                    {formatDurationShort(session.duration)}
                                </Text>
                            </View>
                            {session.volume != null && (
                                <View className="flex-row justify-between">
                                    <Text className="text-zinc-500 text-sm">Volume</Text>
                                    <Text className="font-sans-medium text-white text-sm">
                                        {session.volume}
                                    </Text>
                                </View>
                            )}
                            {session.mediaUrl && (
                                <View className="flex-row justify-between">
                                    <Text className="text-zinc-500 text-sm">Media URL</Text>
                                    <Text
                                        className="font-sans-medium text-white text-sm flex-1 ml-2"
                                        numberOfLines={1}
                                    >
                                        {session.mediaUrl}
                                    </Text>
                                </View>
                            )}
                        </View>
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View className="gap-3">
                    <Link href={`/control/${device.id}`} asChild>
                        <Pressable className="flex-row items-center justify-center gap-3 py-4 rounded-xl bg-approve active:opacity-90">
                            <Ionicons name="play-outline" size={22} color="#ffffff" />
                            <Text className="font-sans-medium text-white">
                                Control device
                            </Text>
                        </Pressable>
                    </Link>
                </View>
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
                            Edit Device
                        </Text>
                        <Text className="text-zinc-400 text-sm mb-2">Name</Text>
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Device name"
                            placeholderTextColor="#71717a"
                            style={{ fontFamily: 'Urbanist_400Regular' }}
                            className="bg-zinc-700 rounded-xl px-4 py-3 text-white mb-4"
                        />
                        <Text className="text-zinc-400 text-sm mb-2">Location</Text>
                        <View className="flex-row flex-wrap gap-2 mb-4">
                            <Pressable
                                onPress={() => setEditLocationId(null)}
                                className={`px-3 py-2 rounded-lg ${editLocationId === null ? 'bg-primary' : 'bg-zinc-700'}`}
                            >
                                <Text className="font-sans-medium text-white text-sm">None</Text>
                            </Pressable>
                            {locations?.map((loc) => (
                                <Pressable
                                    key={loc.id}
                                    onPress={() => setEditLocationId(loc.id)}
                                    className={`px-3 py-2 rounded-lg ${editLocationId === loc.id ? 'bg-primary' : 'bg-zinc-700'}`}
                                >
                                    <Text className="font-sans-medium text-white text-sm">{loc.name}</Text>
                                </Pressable>
                            ))}
                        </View>
                        <Text className="text-zinc-400 text-sm mb-2">Current playlist</Text>
                        <View className="flex-row flex-wrap gap-2 mb-6">
                            <Pressable
                                onPress={() => setEditActivePlaylistId(null)}
                                className={`px-3 py-2 rounded-lg ${editActivePlaylistId === null ? 'bg-primary' : 'bg-zinc-700'}`}
                            >
                                <Text className="font-sans-medium text-white text-sm">None</Text>
                            </Pressable>
                            {playlists?.map((p) => (
                                <Pressable
                                    key={p.id}
                                    onPress={() => setEditActivePlaylistId(p.id)}
                                    className={`px-3 py-2 rounded-lg ${editActivePlaylistId === p.id ? 'bg-primary' : 'bg-zinc-700'}`}
                                >
                                    <Text className="font-sans-medium text-white text-sm">{p.name}</Text>
                                </Pressable>
                            ))}
                        </View>
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
                                disabled={!editName.trim() || updateDevice.isPending}
                                className="flex-1 py-3 rounded-xl bg-approve items-center disabled:opacity-50"
                            >
                                {updateDevice.isPending ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
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
                visible={confirmDelete}
                title="Delete Device"
                message={
                    device
                        ? `Remove "${device.name}"? This cannot be undone.`
                        : ''
                }
                confirmText="Delete"
                cancelText="Cancel"
                confirmStyle="destructive"
                onConfirm={onConfirmDelete}
                onCancel={() => setConfirmDelete(false)}
            />
        </View>
    );
}
