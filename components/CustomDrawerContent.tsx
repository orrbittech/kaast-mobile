import { View, Pressable } from 'react-native';
import {
    DrawerContentScrollView,
    DrawerItemList,
    type DrawerContentComponentProps,
} from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClerk } from '@clerk/clerk-expo';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Text } from './ui/Text';

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
        await signOut();
        router.replace('/sign-in');
    };

    return (
        <View className="flex-1 bg-[#171717]">
            <DrawerContentScrollView
                {...props}
                contentContainerStyle={{ flexGrow: 1 }}
                style={{ backgroundColor: '#171717' }}
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
            <View className="shrink-0 px-4 pb-8 pt-4 border-t border-zinc-800">
                <Pressable
                    onPress={onSignOut}
                    className="flex-row items-center justify-center gap-2 p-4 rounded-xl bg-cancel active:opacity-90"
                >
                    <Ionicons
                        name="log-out-outline"
                        size={20}
                        color="#ffffff"
                    />
                    <Text className="font-sans-medium text-white">
                        Sign Out
                    </Text>
                </Pressable>
                <Text className="text-center text-zinc-500 text-xs mt-3">
                    Version {appVersion}
                </Text>
            </View>
        </View>
    );
}
