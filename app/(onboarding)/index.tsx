import { useState, useRef } from 'react';
import {
    View,
    Pressable,
    ScrollView,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { setOnboardingComplete, SLIDES } from '../../lib/onboarding';
import { colors } from '../../lib/theme/colors';
import { Text } from '../../components/ui/Text';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Onboarding screen - dark theme with project colors, centered content.
 * Indie Flower titles, circular primary button, Skip control.
 */
export default function OnboardingScreen() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = e.nativeEvent.contentOffset.x;
        const index = Math.round(offset / SCREEN_WIDTH);
        setCurrentIndex(index);
    };

    const onGetStarted = async () => {
        await setOnboardingComplete();
        router.replace('/sign-in');
    };

    const onNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            scrollRef.current?.scrollTo({
                x: (currentIndex + 1) * SCREEN_WIDTH,
                animated: true,
            });
        } else {
            onGetStarted();
        }
    };

    return (
        <View className="flex-1 bg-base">
            <StatusBar style="light" />
            <SafeAreaView
                className="flex-1"
                edges={['left', 'right', 'bottom']}
            >
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={onScroll}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    {SLIDES.map((slide, index) => (
                        <View
                            key={index}
                            className="flex-1 px-8 justify-end items-center pb-24"
                            style={{ width: SCREEN_WIDTH }}
                        >
                            {/* Content wrapper - pushed toward bottom */}
                            <View className="items-center w-full">
                                {/* Hero area - abstract shapes enlarged 20% */}
                                <View className="flex-row gap-5">
                                    <View
                                        className="rounded-xl opacity-15"
                                        style={{
                                            width: 95 * 2,
                                            height: 198 * 2,
                                            backgroundColor: colors.primary,
                                            transform: [{ rotate: '-6deg' }],
                                        }}
                                    />
                                    <View
                                        className="rounded-xl opacity-10"
                                        style={{
                                            width: 95 * 2,
                                            height: 172 * 2,
                                            backgroundColor: colors.primary,
                                            transform: [
                                                { rotate: '4deg' },
                                                { translateY: 8 },
                                            ],
                                        }}
                                    />
                                </View>

                                {/* Title - Indie Flower font, centered (+10% size) */}
                                {slide.highlight && (
                                    <Text
                                        className="text-center p-3"
                                        style={{
                                            color: colors.primary,
                                            fontFamily: 'IndieFlower_400Regular',
                                            fontSize: 35,
                                            fontWeight: '800',
                                            lineHeight: 36,
                                        }}
                                    >
                                        {slide.highlight}
                                    </Text>
                                )}
                                <Text
                                    className="text-white text-center p-3"
                                    style={{
                                        fontFamily: 'IndieFlower_400Regular',
                                        fontSize: 35, // text-4xl (35px) + 10%
                                        fontWeight: '800',
                                        lineHeight: 36,
                                    }}
                                >
                                    {slide.title}
                                </Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Bottom navigation */}
                <View className="flex-row items-center justify-between px-6 pb-8">
                    <Pressable
                        onPress={onGetStarted}
                        className="py-3 active:opacity-70"
                    >
                        <Text
                            className="text-zinc-400"
                            style={{
                                fontFamily: 'IndieFlower_400Regular',
                                fontSize: 18, // default 16px + 10%
                            }}
                        >
                            Skip
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={onNext}
                        className="w-14 h-14 rounded-full bg-primary items-center justify-center active:opacity-90"
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={28}
                            color="#ffffff"
                        />
                    </Pressable>
                </View>
            </SafeAreaView>
        </View>
    );
}
