import { View, Pressable } from 'react-native';
import {
    DrawerContentScrollView,
    DrawerItem,
    DrawerItemList,
    type DrawerContentComponentProps,
} from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClerk } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { invalidateOnSignOut } from '../lib/api/invalidate';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Text } from './ui/Text';
import { colors } from '../lib/theme/colors';

/**
 * Custom drawer content - logo, nav items, sign out and app version at bottom.
 */
export function CustomDrawerContent(props: DrawerContentComponentProps) {
    const router = useRouter();
    const { signOut } = useClerk();
    const appVersion =
        Application.nativeApplicationVersion ??
        Constants.expoConfig?.version ??
        '—';

    const onSignOut = async () => {
        props.navigation.closeDrawer();
        invalidateOnSignOut();
        await signOut();
        router.replace('/sign-in');
    };

    return (
        <SafeAreaView
            className="flex-1 bg-[#171717]"
            edges={['bottom']}
        >
            <View className="flex-1">
                <DrawerContentScrollView
                    {...props}
                    style={{ flex: 1, backgroundColor: '#171717' }}
                    contentContainerStyle={{ paddingBottom: 8 }}
                >
                    <View className="flex-row items-center justify-between px-4 py-6">
                        <View>
                            <Text className="text-xl font-sans-semibold text-white">
                                Kaast
                            </Text>
                            <Text className="text-sm text-zinc-400 mt-1">
                                Media Control
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => props.navigation.closeDrawer()}
                            className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center active:opacity-80"
                        >
                            <Ionicons name="close" size={24} color="#ffffff" />
                        </Pressable>
                    </View>
                    <DrawerItemList {...props} />
                </DrawerContentScrollView>

                <View className="shrink-0 border-t border-zinc-800">
                    <DrawerItem
                        label="Sign Out"
                        onPress={onSignOut}
                        icon={({ color, size }) => (
                            <Ionicons
                                name="log-out-outline"
                                size={size}
                                color={color}
                            />
                        )}
                        inactiveTintColor={colors.primaryHex}
                        activeTintColor={colors.primaryHex}
                        activeBackgroundColor="transparent"
                        labelStyle={{ fontFamily: 'Urbanist_500Medium' }}
                    />
                    <Text className="text-center text-zinc-500 text-xs pb-4">
                        Version {appVersion}
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
