import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface RemoteControlButtonProps extends PressableProps {
    children: ReactNode;
    className?: string;
    style?: StyleProp<ViewStyle>;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'p-3 rounded-full bg-zinc-800',
    md: 'p-4 rounded-full bg-zinc-800',
    lg: 'p-5 rounded-full bg-primary',
};

export function RemoteControlButton({
    children,
    className,
    style,
    size = 'sm',
    onPress,
    disabled,
    ...props
}: RemoteControlButtonProps) {
    const scale = useSharedValue(1);
    const rotate = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}deg` },
        ],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.9, { damping: 12, stiffness: 400 });
        rotate.value = withSequence(
            withSpring(-3, { damping: 10, stiffness: 500 }),
            withSpring(3, { damping: 10, stiffness: 500 }),
            withSpring(0, { damping: 12, stiffness: 400 }),
        );
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 400 });
    };

    return (
        <AnimatedPressable
            {...props}
            disabled={disabled}
            className={className ?? sizeClasses[size]}
            style={[style, animatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={(event) => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress?.(event);
            }}
        >
            {children}
        </AnimatedPressable>
    );
}
