import { View, Pressable } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui/Text';

interface SummaryCardProps {
    /** Section title (e.g. "Devices", "Media") */
    title: string;
    /** Route for "See all" link */
    href: Href;
    /** Icon name from Ionicons */
    icon: keyof typeof Ionicons.glyphMap;
    /** Main content - stats and labels */
    children: React.ReactNode;
}

/**
 * Reusable summary card with icon, title, "See all" link, and content.
 * Uses bg-zinc-800, rounded-xl, approve/other accents per design system.
 */
export function SummaryCard({ title, href, icon, children }: SummaryCardProps) {
    return (
        <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xl font-sans-semibold text-white">
                    {title}
                </Text>
                <Link href={href} asChild>
                    <Pressable>
                        <Text className="text-other text-base">See all</Text>
                    </Pressable>
                </Link>
            </View>
            <Link href={href} asChild>
                <Pressable className="p-4 rounded-xl bg-zinc-800 active:opacity-90">
                    <View className="flex-row items-start gap-4">
                        <View className="w-14 h-14 rounded-xl bg-zinc-700 items-center justify-center">
                            <Ionicons
                                name={icon}
                                size={28}
                                color="#ffffff"
                            />
                        </View>
                        <View className="flex-1">{children}</View>
                    </View>
                </Pressable>
            </Link>
        </View>
    );
}

interface StatRowProps {
    label: string;
    value: string | number;
    /** Use green for active/positive metrics */
    highlight?: boolean;
    /** Use red for inactive metrics */
    inactive?: boolean;
}

/** Single stat row: label + value */
export function StatRow({ label, value, highlight, inactive }: StatRowProps) {
    const valueColor = highlight
        ? 'text-approve'
        : inactive
          ? 'text-primary'
          : 'text-white';
    return (
        <View className="flex-row justify-between items-center py-1.5">
            <Text className="text-zinc-400 text-base">{label}</Text>
            <Text className={`font-sans-semibold text-lg ${valueColor}`}>
                {value}
            </Text>
        </View>
    );
}
