import type { ReactNode } from 'react';
import { View, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { Text } from './ui/Text';
import { colors } from '../lib/theme/colors';
import type { PlaylistDeviceStats } from '../lib/hooks/usePlaylistDeviceStats';

const APPROVE_HEX = '#16a34a';
const ZINC_HEX = '#71717a';
const CHART_CARD_WIDTH = 168;

interface PlaylistStatsChartsProps {
    stats: Pick<
        PlaylistDeviceStats,
        | 'playingCount'
        | 'notPlayingCount'
        | 'onlineCount'
        | 'offlineCount'
        | 'mediaTypeCounts'
        | 'assignedDevices'
    >;
    isLoading?: boolean;
}

function ChartCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <View
            className="rounded-xl bg-zinc-800 p-4 mr-3"
            style={{ width: CHART_CARD_WIDTH }}
        >
            <Text className="text-zinc-200 text-xs mb-3 font-sans-medium">{title}</Text>
            {children}
        </View>
    );
}

function EmptyChartPlaceholder({ message }: { message: string }) {
    return (
        <View className="h-28 items-center justify-center px-2">
            <Text className="text-zinc-300 text-xs text-center">{message}</Text>
        </View>
    );
}

function LegendRow({
    color,
    label,
    value,
}: {
    color: string;
    label: string;
    value: number;
}) {
    return (
        <View className="flex-row items-center gap-1.5 mt-1">
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <Text className="text-zinc-300 text-xs">
                {label} ({value})
            </Text>
        </View>
    );
}

export function PlaylistStatsCharts({ stats, isLoading }: PlaylistStatsChartsProps) {
    const { width: screenWidth } = useWindowDimensions();
    const assignedTotal = stats.assignedDevices.length;
    const itemTotal =
        stats.mediaTypeCounts.video +
        stats.mediaTypeCounts.audio +
        stats.mediaTypeCounts.image +
        stats.mediaTypeCounts.media;

    const playbackData =
        stats.playingCount > 0 || stats.notPlayingCount > 0
            ? [
                  { value: stats.playingCount, color: APPROVE_HEX },
                  { value: stats.notPlayingCount, color: ZINC_HEX },
              ]
            : [{ value: 1, color: '#3f3f46' }];

    const onlineData =
        stats.onlineCount > 0 || stats.offlineCount > 0
            ? [
                  { value: stats.onlineCount, color: APPROVE_HEX },
                  { value: stats.offlineCount, color: colors.primaryHex },
              ]
            : [{ value: 1, color: '#3f3f46' }];

    const barData = [
        {
            value: stats.mediaTypeCounts.video,
            label: 'Vid',
            frontColor: APPROVE_HEX,
        },
        {
            value: stats.mediaTypeCounts.audio,
            label: 'Aud',
            frontColor: '#3b82f6',
        },
        {
            value: stats.mediaTypeCounts.image,
            label: 'Img',
            frontColor: '#a855f7',
        },
        {
            value: stats.mediaTypeCounts.media,
            label: 'Other',
            frontColor: ZINC_HEX,
        },
    ];

    const maxBarValue = Math.max(...barData.map((item) => item.value), 1);

    if (isLoading && assignedTotal === 0 && itemTotal === 0) {
        return (
            <View className="py-8 items-center mb-6">
                <ActivityIndicator size="small" color={colors.primaryHex} />
            </View>
        );
    }

    return (
        <View className="mb-6">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: Math.max(0, screenWidth - CHART_CARD_WIDTH - 48) }}
            >
                <ChartCard title="Playback">
                    {assignedTotal === 0 ? (
                        <EmptyChartPlaceholder message="No devices assigned" />
                    ) : (
                        <View className="items-center">
                            <PieChart
                                data={playbackData}
                                radius={52}
                                innerRadius={32}
                                donut
                                centerLabelComponent={() => (
                                    <View className="items-center">
                                        <Text className="text-white text-sm font-sans-semibold">
                                            {stats.playingCount}/{assignedTotal}
                                        </Text>
                                        <Text className="text-zinc-500 text-[10px]">playing</Text>
                                    </View>
                                )}
                            />
                            <LegendRow
                                color={APPROVE_HEX}
                                label="Playing"
                                value={stats.playingCount}
                            />
                            <LegendRow
                                color={ZINC_HEX}
                                label="Not playing"
                                value={stats.notPlayingCount}
                            />
                        </View>
                    )}
                </ChartCard>

                <ChartCard title="Online status">
                    {assignedTotal === 0 ? (
                        <EmptyChartPlaceholder message="No devices assigned" />
                    ) : (
                        <View className="items-center">
                            <PieChart
                                data={onlineData}
                                radius={52}
                                innerRadius={32}
                                donut
                                centerLabelComponent={() => (
                                    <View className="items-center">
                                        <Text className="text-white text-sm font-sans-semibold">
                                            {assignedTotal}
                                        </Text>
                                        <Text className="text-zinc-500 text-[10px]">devices</Text>
                                    </View>
                                )}
                            />
                            <LegendRow
                                color={APPROVE_HEX}
                                label="Online"
                                value={stats.onlineCount}
                            />
                            <LegendRow
                                color={colors.primaryHex}
                                label="Offline"
                                value={stats.offlineCount}
                            />
                        </View>
                    )}
                </ChartCard>

                <ChartCard title="Media types">
                    {itemTotal === 0 ? (
                        <EmptyChartPlaceholder message="No items in playlist" />
                    ) : (
                        <View className="items-center">
                            <BarChart
                                data={barData}
                                barWidth={22}
                                spacing={14}
                                roundedTop
                                roundedBottom
                                hideRules
                                hideYAxisText
                                xAxisThickness={0}
                                yAxisThickness={0}
                                noOfSections={3}
                                maxValue={maxBarValue}
                                height={100}
                                width={130}
                                xAxisLabelTextStyle={{
                                    color: ZINC_HEX,
                                    fontSize: 10,
                                }}
                            />
                            <Text className="text-zinc-500 text-xs mt-2">{itemTotal} items</Text>
                        </View>
                    )}
                </ChartCard>
            </ScrollView>
        </View>
    );
}
