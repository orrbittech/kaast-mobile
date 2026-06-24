import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui/Text';
import { colors } from '../lib/theme/colors';
import { getStatusBadgeClasses } from '../lib/utils/device-status';
import type { Location, PlaylistAssignedDevice } from '../lib/api';

const APPROVE_HEX = '#16a34a';

interface PlaylistDevicesSectionProps {
    devices: PlaylistAssignedDevice[];
    locations?: Location[];
}

function getLocationName(device: PlaylistAssignedDevice, locations?: Location[]): string {
    return locations?.find((location) => location.id === device.locationId)?.name ?? 'Unassigned';
}

function assignmentLabel(source: PlaylistAssignedDevice['assignmentSource']): string {
    switch (source) {
        case 'manual':
            return 'Manual';
        case 'schedule':
            return 'Scheduled';
        case 'both':
            return 'Manual + Scheduled';
        default: {
            const _exhaustive: never = source;
            return _exhaustive;
        }
    }
}

function AssignedDeviceRow({
    device,
    locationName,
    onPress,
}: {
    device: PlaylistAssignedDevice;
    locationName: string;
    onPress: () => void;
}) {
    const { bg: statusBg, text: statusText } = getStatusBadgeClasses(device.status);

    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center gap-3 p-3 rounded-xl bg-zinc-800 active:opacity-95"
        >
            <View className="w-10 h-10 rounded-lg bg-zinc-700/80 items-center justify-center">
                <Ionicons name="tv-outline" size={24} color={colors.primaryHex} />
            </View>
            <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-2">
                    <Text
                        className="font-sans-semibold text-white text-base flex-1"
                        numberOfLines={1}
                    >
                        {device.name}
                    </Text>
                    <View className={`px-2 py-0.5 rounded ${statusBg}`}>
                        <Text className={`font-sans-medium text-xs capitalize ${statusText}`}>
                            {device.status}
                        </Text>
                    </View>
                </View>
                <Text className="text-zinc-300 text-sm mt-0.5" numberOfLines={1}>
                    {locationName}
                </Text>
                <Text className="text-zinc-400 text-xs mt-0.5">
                    {assignmentLabel(device.assignmentSource)}
                </Text>
            </View>
            <Ionicons
                name={device.isPlaying ? 'play-circle' : 'pause-circle-outline'}
                size={22}
                color={device.isPlaying ? APPROVE_HEX : '#71717a'}
            />
        </Pressable>
    );
}

export function PlaylistDevicesSection({ devices, locations }: PlaylistDevicesSectionProps) {
    const router = useRouter();

    return (
        <View className="mb-8">
            <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-zinc-200 text-sm font-sans-medium">Devices</Text>
                <View className="px-2 py-0.5 rounded-md bg-zinc-800">
                    <Text className="text-zinc-200 text-xs font-sans-medium">
                        {devices.length}
                    </Text>
                </View>
            </View>

            {devices.length === 0 ? (
                <View className="py-6 px-4 rounded-xl bg-zinc-800">
                    <Text className="text-zinc-200 text-center">
                        Not assigned to any device yet.
                    </Text>
                    <Text className="text-zinc-300 text-xs text-center mt-2">
                        Assign this playlist from a device&apos;s detail or control screen, or add a
                        schedule slot below.
                    </Text>
                </View>
            ) : (
                <View className="gap-2">
                    {devices.map((device) => (
                        <AssignedDeviceRow
                            key={device.id}
                            device={device}
                            locationName={getLocationName(device, locations)}
                            onPress={() => router.push(`/control/${device.id}`)}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}
