import { View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui/Text';
import { colors } from '../lib/theme/colors';
import { getStatusBadgeClasses } from '../lib/utils/device-status';
import type { Device } from '../lib/api';

interface DeviceCardProps {
    device: Device;
    locationName?: string;
    onPress?: () => void;
    onEditPress?: () => void;
    onDeletePress?: () => void;
}

/** Format lastSeenAt to relative time (e.g. "2 minutes ago") */
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
 * Device card - descriptive layout with highlighted status, name, location, last played.
 */
export function DeviceCard({
    device,
    locationName = 'Unknown',
    onPress,
    onEditPress,
    onDeletePress,
}: DeviceCardProps) {
    const { bg: statusBg, text: statusText } = getStatusBadgeClasses(device.status);

    const content = (
        <>
            {/* Highlight section: status, name, location, last played */}
            <View className="rounded-xl bg-zinc-700/60 p-4 mb-4">
                <View className="flex-row items-center justify-between mb-3">
                    <View className={`px-3 py-1.5 rounded-lg ${statusBg}`}>
                        <Text
                            className={`font-sans-medium text-sm capitalize ${statusText}`}
                        >
                            {device.status}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center mb-2">
                    <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
                        <Ionicons name="tv-outline" size={22} color="#ffffff" />
                    </View>
                    <Text className="font-sans-semibold text-white text-base flex-1">
                        {device.name}
                    </Text>
                    {(onEditPress || onDeletePress) && (
                        <View className="flex-row items-center gap-1">
                            {onEditPress && (
                                <Pressable
                                    onPress={(e) => {
                                        e?.stopPropagation?.();
                                        onEditPress();
                                    }}
                                    className="w-9 h-9 rounded-lg items-center justify-center active:opacity-70"
                                    accessibilityLabel="Edit device"
                                >
                                    <Ionicons
                                        name="pencil-outline"
                                        size={20}
                                        color="#a1a1aa"
                                    />
                                </Pressable>
                            )}
                            {onDeletePress && (
                                <Pressable
                                    onPress={(e) => {
                                        e?.stopPropagation?.();
                                        onDeletePress();
                                    }}
                                    className="w-9 h-9 rounded-lg items-center justify-center active:opacity-70"
                                    accessibilityLabel="Delete device"
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={20}
                                        color={colors.primaryHex}
                                    />
                                </Pressable>
                            )}
                        </View>
                    )}
                </View>
                <View className="gap-1.5">
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="location-outline" size={14} color="#71717a" />
                        <Text className="text-zinc-400 text-sm">
                            {locationName}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="time-outline" size={14} color="#71717a" />
                        <Text className="text-zinc-400 text-sm">
                            Last played: {formatLastSeen(device.lastSeenAt)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Bottom - red chevron and click to view more */}
            <View className="flex-row items-center justify-end">
                <Link href={`/control/${device.id}`} asChild>
                    <Pressable className="flex-row items-center gap-2 py-2 px-3 rounded-xl active:opacity-80">
                        <Text className="text-primary font-sans-medium text-sm">
                            Click to view more
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={22}
                            color={colors.primaryHex}
                        />
                    </Pressable>
                </Link>
            </View>
        </>
    );

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                className="rounded-2xl bg-zinc-800 p-4 shadow-lg active:opacity-95"
            >
                {content}
            </Pressable>
        );
    }

    return (
        <View className="rounded-2xl bg-zinc-800 p-4 shadow-lg">
            {content}
        </View>
    );
}
