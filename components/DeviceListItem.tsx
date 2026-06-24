import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui/Text';
import { colors } from '../lib/theme/colors';
import { getStatusBadgeClasses } from '../lib/utils/device-status';
import type { Device } from '../lib/api';

interface DeviceListItemProps {
    device: Device;
    locationName?: string;
    onPress?: () => void;
}

/**
 * Device list item - compact row for search modal:
 * Device icon, name, status, and location. Kept simple to match Media/Playlists search.
 */
export function DeviceListItem({
    device,
    locationName = 'Unassigned',
    onPress,
}: DeviceListItemProps) {
    const { bg: statusBg, text: statusText } = getStatusBadgeClasses(device.status);

    const content = (
        <View className="flex-row items-center gap-3 p-3 rounded-xl bg-zinc-800">
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
                <Text className="text-zinc-500 text-sm mt-0.5" numberOfLines={1}>
                    {locationName}
                </Text>
            </View>
        </View>
    );

    if (onPress) {
        return (
            <Pressable onPress={onPress} className="active:opacity-95">
                {content}
            </Pressable>
        );
    }

    return content;
}
