import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CustomDrawerContent } from '../../components/CustomDrawerContent';
import { DetailHeaderLeft } from '../../components/DetailHeaderLeft';
import { HeaderAvatar } from '../../components/HeaderAvatar';
import { TrialExpiredGate } from '../../components/TrialExpiredGate';
import { SubscriptionProvider } from '../../lib/context/SubscriptionContext';
import { useActiveOrgContext } from '../../lib/hooks';
import { refreshBillingStatus } from '../../lib/hooks/useSubscriptionStatus';
import { colors } from '../../lib/theme/colors';

/**
 * Drawer layout - left-pull navigation for main app screens.
 * Redirects to sign-in when user is not authenticated.
 */
export default function DrawerLayout() {
    const { isSignedIn, getToken, isLoaded } = useAuth();
    const { clerkOrgId } = useActiveOrgContext();
    const lastOrgIdRef = useRef<string | undefined>();

    useEffect(() => {
        if (!isLoaded || !clerkOrgId) return;
        if (lastOrgIdRef.current === clerkOrgId) return;

        lastOrgIdRef.current = clerkOrgId;
        void refreshBillingStatus(clerkOrgId, getToken);
    }, [clerkOrgId, getToken, isLoaded]);

    if (!isSignedIn) {
        return <Redirect href="/sign-in" />;
    }

    return (
        <SubscriptionProvider clerkOrgId={clerkOrgId}>
            <TrialExpiredGate clerkOrgId={clerkOrgId}>
                <Drawer
                    drawerContent={(props) => <CustomDrawerContent {...props} />}
                    screenOptions={{
                        drawerPosition: 'left',
                        drawerType: 'front',
                        headerShown: true,
                        headerTitle: () => null,
                        headerLeft: () => <DetailHeaderLeft />,
                        headerRight: () => <HeaderAvatar />,
                        swipeEnabled: true,
                        headerTransparent: true,
                        headerStyle: { backgroundColor: 'transparent' },
                        headerTintColor: '#ffffff',
                        headerTitleStyle: { fontFamily: 'Urbanist_600SemiBold' },
                        headerBlurEffect: 'dark',
                        drawerStyle: { backgroundColor: '#171717' },
                        drawerActiveTintColor: colors.primaryHex,
                        drawerInactiveTintColor: '#e4e4e7',
                        drawerActiveBackgroundColor: 'transparent',
                        drawerLabelStyle: { fontFamily: 'Urbanist_500Medium' },
                        overlayColor: 'rgba(0,0,0,0.5)',
                    }}
                >
                    <Drawer.Screen
                        name="index"
                        options={{
                            drawerLabel: 'Home',
                            drawerIcon: ({ color, size }) => (
                                <Ionicons
                                    name="home-outline"
                                    size={size}
                                    color={color}
                                />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="devices"
                        options={{
                            drawerLabel: 'Devices',
                            drawerIcon: ({ color, size }) => (
                                <Ionicons
                                    name="phone-portrait-outline"
                                    size={size}
                                    color={color}
                                />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="media"
                        options={{
                            drawerLabel: 'Media',
                            drawerIcon: ({ color, size }) => (
                                <Ionicons
                                    name="play-circle-outline"
                                    size={size}
                                    color={color}
                                />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="playlists"
                        options={{
                            drawerLabel: 'Playlists',
                            drawerIcon: ({ color, size }) => (
                                <Ionicons
                                    name="list-outline"
                                    size={size}
                                    color={color}
                                />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="profile"
                        options={{
                            drawerLabel: 'Profile',
                            drawerItemStyle: { display: 'none' },
                        }}
                    />
                    <Drawer.Screen
                        name="settings"
                        options={{
                            drawerLabel: 'Settings',
                            drawerIcon: ({ color, size }) => (
                                <Ionicons
                                    name="settings-outline"
                                    size={size}
                                    color={color}
                                />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="control/[device-id]"
                        options={{
                            drawerLabel: 'Control',
                            drawerItemStyle: { display: 'none' },
                        }}
                    />
                </Drawer>
            </TrialExpiredGate>
        </SubscriptionProvider>
    );
}
