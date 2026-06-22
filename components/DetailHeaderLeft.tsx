import { Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useNavigation, DrawerActions } from 'expo-router/react-navigation';
import { ChevronLeft, Menu } from 'lucide-react-native';

/**
 * Header left component - shows back button on detail pages, menu toggle on list pages.
 * Detail routes: devices/[id], playlists/[id], control/[deviceId]
 */
export function DetailHeaderLeft() {
    const router = useRouter();
    const pathname = usePathname();
    const navigation = useNavigation();

    const isDetailPage =
        /^\/devices\/[^/]+$/.test(pathname) ||
        /^\/playlists\/[^/]+$/.test(pathname) ||
        /^\/control\/[^/]+$/.test(pathname);

    if (isDetailPage) {
        return (
            <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500 items-center justify-center active:opacity-80 ml-4"
            >
                <ChevronLeft size={24} color="#ef4444" strokeWidth={2.5} />
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            className="w-10 h-10 rounded-full items-center justify-center active:opacity-80 ml-4"
        >
            <Menu size={24} color="#ffffff" strokeWidth={2} />
        </Pressable>
    );
}
