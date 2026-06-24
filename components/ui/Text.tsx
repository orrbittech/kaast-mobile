import { StyleSheet, Text as RNText, TextProps } from 'react-native';

/**
 * App Text component with Urbanist font as default.
 * Use font-sans-medium, font-sans-semibold, or font-indie-flower in className for other fonts.
 * Only applies default font when style/className does not specify fontFamily.
 */
export function Text({ style, ...props }: TextProps) {
    const flattened = style ? StyleSheet.flatten(style) : undefined;
    const hasFontFamily = flattened?.fontFamily != null;
    const baseStyle = !hasFontFamily ? { fontFamily: 'Urbanist_400Regular' } : undefined;
    return (
        <RNText
            style={[baseStyle, style].filter(Boolean)}
            {...props}
        />
    );
}
