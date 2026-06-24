import { View, Pressable, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useClerk } from '@clerk/clerk-expo';
import { useLocalCredentials } from '@clerk/clerk-expo/local-credentials';
import { invalidateOnSignOut } from '../../lib/api/invalidate';
import { usersApi } from '../../lib/api/services/users.api';
import { Text } from '../../components/ui/Text';
import { DRAWER_HEADER_HEIGHT } from '../../lib/constants';

const accountPortalUrl = process.env.EXPO_PUBLIC_CLERK_ACCOUNT_PORTAL_URL;
const PRIVACY_URL = 'https://kaast.app/privacy';
const TERMS_URL = 'https://kaast.app/terms';
const BILLING_URL = 'https://kaast.app/billing';

/**
 * Settings screen - app preferences, Clerk account/security, data rights, and sign out.
 */
export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { signOut } = useClerk();
    const { userOwnsCredentials, clearCredentials } = useLocalCredentials();
    const contentTopPadding = insets.top + DRAWER_HEADER_HEIGHT + 24;

    const onRemoveBiometricCredentials = async () => {
        try {
            await clearCredentials?.();
            Alert.alert('Done', 'Biometric credentials have been removed.');
        } catch {
            Alert.alert('Error', 'Failed to remove biometric credentials.');
        }
    };

    const openAccountPortal = async () => {
        if (accountPortalUrl) {
            await WebBrowser.openBrowserAsync(accountPortalUrl);
        } else {
            Alert.alert(
                'Not configured',
                'Account Portal URL is not set. Add EXPO_PUBLIC_CLERK_ACCOUNT_PORTAL_URL to your .env.',
                [{ text: 'OK' }],
            );
        }
    };

    const handleExportData = async () => {
        try {
            const data = await usersApi.exportMe();
            const json = JSON.stringify(data, null, 2);
            await Share.share({
                message: json,
                title: 'KAAST data export',
            });
        } catch {
            Alert.alert('Error', 'Could not export your data. Please try again.');
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete account',
            'This permanently deletes your account and organization data. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await usersApi.deleteMe();
                            invalidateOnSignOut();
                            await signOut?.();
                            router.replace('/sign-in');
                        } catch {
                            Alert.alert(
                                'Error',
                                'Could not delete your account. Please try again or contact support.',
                            );
                        }
                    },
                },
            ],
        );
    };

    const onSignOut = async () => {
        invalidateOnSignOut();
        await signOut?.();
        router.replace('/sign-in');
    };

    return (
        <View
            className="flex-1 bg-base px-6"
            style={{ paddingTop: contentTopPadding }}
        >
            <View className="max-w-md">
                <Text className="text-2xl font-sans-semibold text-white mb-2">
                    Settings
                </Text>
                <Text className="text-zinc-400 mb-6">
                    Manage your account and preferences
                </Text>

                <View className="gap-4">
                    <Pressable
                        onPress={openAccountPortal}
                        className="p-4 rounded-xl bg-zinc-800 active:opacity-80"
                    >
                        <View className="flex-row justify-between items-center">
                            <Text className="font-sans-medium text-white">
                                Account
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color="#a1a1aa"
                            />
                        </View>
                        <Text className="text-sm text-zinc-400 mt-1">
                            Profile and organization
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => WebBrowser.openBrowserAsync(BILLING_URL)}
                        className="p-4 rounded-xl bg-zinc-800 active:opacity-80"
                    >
                        <View className="flex-row justify-between items-center">
                            <Text className="font-sans-medium text-white">
                                Billing
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color="#a1a1aa"
                            />
                        </View>
                        <Text className="text-sm text-zinc-400 mt-1">
                            Manage subscription and trial
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={openAccountPortal}
                        className="p-4 rounded-xl bg-zinc-800 active:opacity-80"
                    >
                        <View className="flex-row justify-between items-center">
                            <Text className="font-sans-medium text-white">
                                Security
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color="#a1a1aa"
                            />
                        </View>
                        <Text className="text-sm text-zinc-400 mt-1">
                            Password, 2FA, and connected accounts
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={handleExportData}
                        className="p-4 rounded-xl bg-zinc-800 active:opacity-80"
                    >
                        <Text className="font-sans-medium text-white">
                            Download my data
                        </Text>
                        <Text className="text-sm text-zinc-400 mt-1">
                            Export your profile and organization data
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={handleDeleteAccount}
                        className="p-4 rounded-xl bg-zinc-800 active:opacity-80"
                    >
                        <Text className="font-sans-medium text-white">
                            Delete account
                        </Text>
                        <Text className="text-sm text-zinc-400 mt-1">
                            Permanently remove your account and data
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => Linking.openURL(PRIVACY_URL)}
                        className="p-4 rounded-xl bg-zinc-800 active:opacity-80"
                    >
                        <Text className="font-sans-medium text-white">
                            Privacy Policy
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => Linking.openURL(TERMS_URL)}
                        className="p-4 rounded-xl bg-zinc-800 active:opacity-80"
                    >
                        <Text className="font-sans-medium text-white">
                            Terms of Use
                        </Text>
                    </Pressable>

                    {userOwnsCredentials ? (
                        <Pressable
                            onPress={onRemoveBiometricCredentials}
                            className="p-4 rounded-xl bg-zinc-800 active:opacity-80"
                        >
                            <Text className="font-sans-medium text-white">
                                Remove biometric credentials
                            </Text>
                            <Text className="text-sm text-zinc-400 mt-1">
                                Disable Face ID or fingerprint sign-in
                            </Text>
                        </Pressable>
                    ) : null}

                    <Pressable
                        onPress={onSignOut}
                        className="mt-6 p-4 rounded-xl bg-cancel active:opacity-90"
                    >
                        <Text className="font-sans-medium text-white text-center">
                            Sign Out
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}
