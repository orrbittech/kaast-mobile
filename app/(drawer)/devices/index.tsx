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
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    useActiveOrgContext,
    useDevices,
    useCreateDevice,
    useUpdateDevice,
    useDeleteDevice,
    usePairDevice,
} from '../../../lib/hooks';
import { Text } from '../../../components/ui/Text';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { DeviceCard } from '../../../components/DeviceCard';
import { DeviceListItem } from '../../../components/DeviceListItem';
import { DRAWER_HEADER_HEIGHT } from '../../../lib/constants';
import { colors } from '../../../lib/theme/colors';
import { getUserFriendlyMessage } from '../../../lib/api';

export default function DevicesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const contentTopPadding = insets.top + DRAWER_HEADER_HEIGHT + 12;

    const { clerkOrgId, locations, org: firstOrg } = useActiveOrgContext();

    const {
        data: devices,
        isLoading,
        error,
        refetch,
        isRefetching,
    } = useDevices(clerkOrgId);
    const createDevice = useCreateDevice(clerkOrgId);
    const updateDevice = useUpdateDevice(clerkOrgId);
    const deleteDevice = useDeleteDevice(clerkOrgId);
    const pairDevice = usePairDevice(clerkOrgId);

    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [pairModalVisible, setPairModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editDevice, setEditDevice] = useState<{
        id: string;
        name: string;
    } | null>(null);

    const [createName, setCreateName] = useState('');
    const [createDeviceId, setCreateDeviceId] = useState('');
    const [pairCode, setPairCode] = useState('');
    const [pairLocationId, setPairLocationId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
    const [confirmDelete, setConfirmDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);

    /** Filter devices by status (online, offline) */
    const statusFilteredDevices = devices
        ? devices.filter((device) => {
              if (statusFilter === 'all') return true;
              return device.status === statusFilter;
          })
        : [];

    /** Filter devices by search query (name, deviceId, location) - applied to status-filtered list */
    const filteredDevices = statusFilteredDevices.filter((device) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const name = device.name.toLowerCase();
        const deviceId = device.deviceId.toLowerCase();
        const locationName =
            locations?.find((l) => l.id === device.locationId)?.name?.toLowerCase() ?? '';
        return (
            name.includes(q) ||
            deviceId.includes(q) ||
            locationName.includes(q)
        );
    });

    const handleCreate = async () => {
        if (!createName.trim() || !createDeviceId.trim()) return;
        try {
            await createDevice.mutateAsync({
                name: createName.trim(),
                deviceId: createDeviceId.trim(),
            });
            setCreateModalVisible(false);
            setCreateName('');
            setCreateDeviceId('');
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const handlePair = async () => {
        if (!pairCode.trim() || pairCode.length !== 6) return;
        try {
            await pairDevice.mutateAsync({
                code: pairCode.trim(),
                ...(pairLocationId && { locationId: pairLocationId }),
            });
            setPairModalVisible(false);
            setPairCode('');
            setPairLocationId(null);
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const handleEdit = async () => {
        if (!editDevice || !editName.trim()) return;
        try {
            await updateDevice.mutateAsync({
                id: editDevice.id,
                body: { name: editName.trim() },
            });
            setEditModalVisible(false);
            setEditDevice(null);
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const handleDelete = (device?: { id: string; name: string } | null) => {
        const target = device ?? editDevice;
        if (!target) return;
        setConfirmDelete(target);
    };

    const onConfirmDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteDevice.mutateAsync(confirmDelete.id);
            setEditDevice(null);
            setConfirmDelete(null);
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const openEditModal = (device: { id: string; name: string }) => {
        setEditDevice(device);
        setEditName(device.name);
        setEditModalVisible(true);
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
                        Devices
                    </Text>
                    <View className="flex-row gap-2 items-center">
                        <Pressable
                            onPress={() => setSearchModalVisible(true)}
                            className="w-10 h-10 rounded-xl bg-zinc-700 items-center justify-center active:opacity-90"
                            accessibilityLabel="Search devices"
                        >
                            <Ionicons name="search-outline" size={20} color="#ffffff" />
                        </Pressable>
                        <Pressable
                            onPress={() => setFilterModalVisible(true)}
                            className="w-10 h-10 rounded-xl bg-zinc-700 items-center justify-center active:opacity-90"
                            accessibilityLabel="Filter by status"
                        >
                            <Ionicons name="filter-outline" size={20} color="#ffffff" />
                        </Pressable>
                        <Pressable
                            onPress={() => firstOrg && setPairModalVisible(true)}
                            disabled={!firstOrg}
                            className={`w-10 h-10 rounded-xl items-center justify-center ${
                                firstOrg ? 'bg-zinc-700 active:opacity-80' : 'bg-zinc-800 opacity-50'
                            }`}
                            accessibilityLabel="Pair device"
                        >
                            <Ionicons name="qr-code-outline" size={22} color="#ffffff" />
                        </Pressable>
                        <Pressable
                            onPress={() => firstOrg && setCreateModalVisible(true)}
                            disabled={!firstOrg}
                            className={`w-10 h-10 rounded-xl items-center justify-center ${
                                firstOrg ? 'bg-approve active:opacity-90' : 'bg-zinc-800 opacity-50'
                            }`}
                            accessibilityLabel="Add device"
                        >
                            <Ionicons name="add" size={22} color="#ffffff" />
                        </Pressable>
                    </View>
                </View>

                {!firstOrg && !isLoading && (
                    <View className="py-6 px-4 rounded-xl bg-zinc-800 mb-4">
                        <Text className="text-zinc-400 text-center">
                            Create or join an firstOrganization first.
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

                {!isLoading && !error && devices && firstOrg && (
                    <View className="gap-4">
                        {statusFilteredDevices.length === 0 ? (
                            <View className="py-12 items-center">
                                <Text className="text-zinc-400 text-center mb-4">
                                    {devices.length === 0
                                        ? 'No devices yet. Pair a TV or add one manually.'
                                        : `No ${statusFilter === 'all' ? '' : statusFilter} devices found.`}
                                </Text>
                                {devices.length === 0 && (
                                    <Pressable
                                        onPress={() => setPairModalVisible(true)}
                                        className="py-3 px-6 rounded-xl bg-approve active:opacity-90"
                                    >
                                        <Text className="font-sans-medium text-white">
                                            Pair Device
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        ) : (
                            statusFilteredDevices.map((device) => (
                                <DeviceCard
                                    key={device.id}
                                    device={device}
                                    locationName={
                                        locations?.find((l) => l.id === device.locationId)?.name ??
                                        'Unassigned'
                                    }
                                    onPress={() => router.push(`/devices/${device.id}`)}
                                    onEditPress={() =>
                                        openEditModal({ id: device.id, name: device.name })
                                    }
                                    onDeletePress={() =>
                                        handleDelete({ id: device.id, name: device.name })
                                    }
                                />
                            ))
                        )}
                    </View>
                )}
            </ScrollView>

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
                            Search Devices
                        </Text>
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search by name, device ID, or location..."
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
                                {filteredDevices.length === 0 ? (
                                    <Text className="text-zinc-400 text-center py-4">
                                        {!devices?.length
                                            ? 'No devices yet. Add or pair a device.'
                                            : searchQuery.trim()
                                              ? 'No devices found.'
                                              : 'Type to search.'}
                                    </Text>
                                ) : (
                                    filteredDevices.map((device) => (
                                        <DeviceListItem
                                            key={device.id}
                                            device={device}
                                            locationName={
                                                locations?.find((l) => l.id === device.locationId)
                                                    ?.name ?? 'Unassigned'
                                            }
                                            onPress={() => {
                                                setSearchModalVisible(false);
                                                router.push(`/devices/${device.id}`);
                                            }}
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
                            {(['all', 'online', 'offline'] as const).map((opt) => (
                                <Pressable
                                    key={opt}
                                    onPress={() => {
                                        setStatusFilter(opt);
                                        setFilterModalVisible(false);
                                    }}
                                    className={`px-4 py-3 rounded-xl ${
                                        statusFilter === opt ? 'bg-approve' : 'bg-zinc-700'
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

            {/* Create Modal */}
            <Modal
                visible={createModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <Pressable
                    className="flex-1 bg-black/60 justify-center items-center px-6"
                    onPress={() => setCreateModalVisible(false)}
                >
                    <Pressable
                        className="w-full max-w-md rounded-2xl bg-zinc-800 p-6"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-lg font-sans-semibold text-white mb-4">
                            Add Device
                        </Text>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        >
                            <Text className="text-zinc-400 text-sm mb-2">Name</Text>
                            <TextInput
                                value={createName}
                                onChangeText={setCreateName}
                                placeholder="e.g. Living Room TV"
                                placeholderTextColor="#71717a"
                                style={{ fontFamily: 'Urbanist_400Regular' }}
                                className="bg-zinc-700 rounded-xl px-4 py-3 text-white mb-4"
                            />
                            <Text className="text-zinc-400 text-sm mb-2">Device ID</Text>
                            <TextInput
                                value={createDeviceId}
                                onChangeText={setCreateDeviceId}
                                placeholder="Unique device identifier"
                                placeholderTextColor="#71717a"
                                style={{ fontFamily: 'Urbanist_400Regular' }}
                                className="bg-zinc-700 rounded-xl px-4 py-3 text-white mb-6"
                            />
                        </KeyboardAvoidingView>
                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={() => setCreateModalVisible(false)}
                                className="flex-1 py-3 rounded-xl bg-primary items-center"
                            >
                                <Text className="font-sans-medium text-white">
                                    Cancel
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={handleCreate}
                                disabled={
                                    !createName.trim() ||
                                    !createDeviceId.trim() ||
                                    createDevice.isPending
                                }
                                className="flex-1 py-3 rounded-xl bg-approve items-center disabled:opacity-50"
                            >
                                {createDevice.isPending ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text className="font-sans-medium text-white">
                                        Create Device
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Pair Modal */}
            <Modal
                visible={pairModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPairModalVisible(false)}
            >
                <Pressable
                    className="flex-1 bg-black/60 justify-center items-center px-6"
                    onPress={() => setPairModalVisible(false)}
                >
                    <Pressable
                        className="w-full max-w-md rounded-2xl bg-zinc-800 p-6"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-lg font-sans-semibold text-white mb-4">
                            Pair Device
                        </Text>
                        <Text className="text-zinc-400 text-sm mb-2">
                            Enter the 6-digit code from your TV
                        </Text>
                        <TextInput
                            value={pairCode}
                            onChangeText={setPairCode}
                            placeholder="123456"
                            placeholderTextColor="#71717a"
                            style={{ fontFamily: 'Urbanist_400Regular' }}
                            keyboardType="number-pad"
                            maxLength={6}
                            className="bg-zinc-700 rounded-xl px-4 py-3 text-white mb-4"
                        />
                        {locations && locations.length > 0 && (
                            <>
                                <Text className="text-zinc-400 text-sm mb-2">Store (optional)</Text>
                                <View className="flex-row flex-wrap gap-2 mb-4">
                                    <Pressable
                                        onPress={() => setPairLocationId(null)}
                                        className={`px-3 py-2 rounded-lg ${pairLocationId === null ? 'bg-primary' : 'bg-zinc-700'}`}
                                    >
                                        <Text className="font-sans-medium text-white text-sm">None</Text>
                                    </Pressable>
                                    {locations.map((loc) => (
                                        <Pressable
                                            key={loc.id}
                                            onPress={() => setPairLocationId(loc.id)}
                                            className={`px-3 py-2 rounded-lg ${pairLocationId === loc.id ? 'bg-primary' : 'bg-zinc-700'}`}
                                        >
                                            <Text className="font-sans-medium text-white text-sm">{loc.name}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </>
                        )}
                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={() => {
                                    setPairModalVisible(false);
                                    setPairLocationId(null);
                                }}
                                className="flex-1 py-3 rounded-xl bg-primary items-center"
                            >
                                <Text className="font-sans-medium text-white">
                                    Cancel
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={handlePair}
                                disabled={
                                    !pairCode.trim() ||
                                    pairCode.length !== 6 ||
                                    pairDevice.isPending
                                }
                                className="flex-1 py-3 rounded-xl bg-approve items-center disabled:opacity-50"
                            >
                                {pairDevice.isPending ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text className="font-sans-medium text-white">
                                        Pair
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

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
                visible={!!confirmDelete}
                title="Delete Device"
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
