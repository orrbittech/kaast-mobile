import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import {
    useDashboardSummary,
    useMediaSession,
} from '../../lib/hooks';
import { Text } from '../../components/ui/Text';
import { SummaryCard, StatRow } from '../../components/SummaryCard';
import { formatDurationLong } from '../../lib/utils/formatDuration';
import { DRAWER_HEADER_HEIGHT } from '../../lib/constants';
import { colors } from '../../lib/theme/colors';

/**
 * Dashboard - summary of devices, media, playlists, and now playing.
 * Card-based layout with stats and quick links.
 */
export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const summary = useDashboardSummary();
    const { data: session } = useMediaSession(summary.firstDeviceId, {
        enabled: !!summary.firstDeviceId,
    });

    if (summary.isLoading) {
        return (
            <View
                className="flex-1 bg-base items-center justify-center"
                style={{
                    paddingTop: insets.top + DRAWER_HEADER_HEIGHT,
                }}
            >
                <ActivityIndicator size="large" color={colors.primaryHex} />
            </View>
        );
    }

    if (!summary.clerkOrgId) {
        return (
            <View
                className="flex-1 bg-base items-center justify-center px-6"
                style={{
                    paddingTop: insets.top + DRAWER_HEADER_HEIGHT,
                }}
            >
                <View className="py-6 px-4 rounded-xl bg-zinc-800">
                    <Text className="text-base text-zinc-400 text-center">
                        Create or join an organization first.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-base"
            contentContainerStyle={{
                flexGrow: 1,
                padding: 24,
                paddingTop: insets.top + DRAWER_HEADER_HEIGHT + 24,
                paddingBottom: 48,
            }}
        >
            {/* Devices Summary */}
            <SummaryCard
                title="Devices"
                href="/devices"
                icon="phone-portrait-outline"
            >
                <View className="gap-1">
                    <StatRow label="Total" value={summary.totalDevices} />
                    <StatRow
                        label="Active"
                        value={summary.activeDevices}
                        highlight
                    />
                    <StatRow
                        label="Inactive"
                        value={summary.inactiveDevices}
                        inactive
                    />
                </View>
            </SummaryCard>

            {/* Media Summary */}
            <SummaryCard
                title="Media"
                href="/media"
                icon="play-circle-outline"
            >
                <View className="gap-1">
                    <StatRow label="Media Files" value={summary.mediaFileCount} />
                    <StatRow
                        label="Total Duration"
                        value={formatDurationLong(summary.totalPlayTimeSec)}
                    />
                </View>
            </SummaryCard>

            {/* Playlists Summary */}
            <SummaryCard
                title="Playlists"
                href="/playlists"
                icon="list-outline"
            >
                <View className="gap-1">
                    <StatRow label="Total" value={summary.totalPlaylists} />
                    <StatRow
                        label="Active"
                        value={summary.activePlaylistCount}
                        highlight
                    />
                    <StatRow
                        label="Total Play Time"
                        value={formatDurationLong(summary.totalPlayTimeSec)}
                    />
                </View>
            </SummaryCard>

            {/* Now Playing */}
            <View className="mb-6">
                <Text className="text-xl font-sans-semibold text-white mb-3">
                    Now Playing
                </Text>
                <View className="p-4 rounded-xl bg-zinc-800">
                    {session?.playing ? (
                        <>
                            <Text className="font-sans-medium text-base text-white">
                                {session.mediaUrl
                                    ? (() => {
                                          try {
                                              return (
                                                  new URL(session.mediaUrl)
                                                      .pathname.split('/')
                                                      .pop() ?? 'Media'
                                              );
                                          } catch {
                                              return 'Media';
                                          }
                                      })()
                                    : 'Unknown'}
                            </Text>
                            <Text className="text-base text-zinc-400 mt-1">
                                {summary.firstDeviceName ?? 'Device'} •{' '}
                                {Math.floor(session.position / 60)}:
                                {String(
                                    Math.floor(session.position % 60),
                                ).padStart(2, '0')}{' '}
                                / {Math.floor(session.duration / 60)}:
                                {String(
                                    Math.floor(session.duration % 60),
                                ).padStart(2, '0')}
                            </Text>
                            {summary.firstDeviceDbId && (
                                <Link
                                    href={`/control/${summary.firstDeviceDbId}`}
                                    asChild
                                >
                                    <Pressable className="mt-3 py-2 px-4 rounded-lg bg-approve self-start active:opacity-90">
                                        <Text className="font-sans-medium text-base text-white">
                                            Control
                                        </Text>
                                    </Pressable>
                                </Link>
                            )}
                        </>
                    ) : (
                        <View className="items-center py-4">
                            <Text className="text-base text-zinc-400 text-center">
                                Nothing playing. Select a device to start.
                            </Text>
                            <Link href="/devices" asChild>
                                <Pressable className="mt-3 py-2 px-4 rounded-lg bg-approve active:opacity-90">
                                    <Text className="font-sans-medium text-base text-white">
                                        View Devices
                                    </Text>
                                </Pressable>
                            </Link>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}
