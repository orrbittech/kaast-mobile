import { useState } from 'react';
import {
    View,
    Pressable,
    Alert,
    Modal,
    ActivityIndicator,
    Share,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useClerk } from '@clerk/clerk-expo';
import { Text } from './ui/Text';
import { useActiveOrgContext } from '../lib/hooks';
import { useSubscriptionGate } from '../lib/context/SubscriptionContext';
import {
    AccountPortalConfigError,
    openAccountPortalBillingAsync,
} from '../lib/openAccountPortal';
import { invalidateOnSignOut } from '../lib/api/invalidate';
import { usersApi } from '../lib/api/services/users.api';
import { colors } from '../lib/theme/colors';

interface TrialExpiredGateProps {
    clerkOrgId?: string;
    children: React.ReactNode;
}

/**
 * Full-screen gate when org subscription is inactive.
 * Drawer stays mounted (hidden) so Expo Router navigation remains stable.
 */
export function TrialExpiredGate({
    clerkOrgId,
    children,
}: TrialExpiredGateProps) {
    const router = useRouter();
    const { signOut } = useClerk();
    const { org } = useActiveOrgContext();
    const isOrgAdmin = org?.role === 'org:admin';
    const { isLoading, isActive } = useSubscriptionGate();
    const [exporting, setExporting] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    const openBilling = async () => {
        try {
            await openAccountPortalBillingAsync(clerkOrgId);
        } catch (err: unknown) {
            const message =
                err instanceof AccountPortalConfigError
                    ? err.message
                    : 'Could not open billing. Please try again.';
            Alert.alert('Not configured', message, [{ text: 'OK' }]);
        }
    };

    const handleDownloadData = async () => {
        setExporting(true);
        try {
            const data = await usersApi.exportMe();
            const json = JSON.stringify(data, null, 2);
            await Share.share({
                message: json,
                title: 'KAAST data export',
            });

            const result = await usersApi.emailExportMe();
            Alert.alert(
                'Export sent',
                `Your data export was emailed to ${result.email}.`,
            );
        } catch {
            Alert.alert(
                'Error',
                'Could not export your data. Please try again.',
            );
        } finally {
            setExporting(false);
        }
    };

    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            invalidateOnSignOut();
            await signOut?.();
            router.replace('/sign-in');
        } catch {
            Alert.alert('Error', 'Could not sign out. Please try again.');
        } finally {
            setSigningOut(false);
        }
    };

    const showGate = !isLoading && !isActive;
    const actionsDisabled = exporting || signingOut;

    return (
        <View style={styles.root}>
            {!showGate ? children : null}
            <Modal
                visible={isLoading || showGate}
                animationType="fade"
                presentationStyle="fullScreen"
                statusBarTranslucent
            >
                <View style={styles.modalContent}>
                    {isLoading ? (
                        <>
                            <ActivityIndicator
                                size="large"
                                color={colors.primaryHex}
                            />
                            <Text className="text-zinc-400 mt-4">
                                Checking subscription...
                            </Text>
                        </>
                    ) : (
                        <View className="w-full max-w-sm">
                            <Text className="text-2xl font-sans-semibold text-white mb-2 text-center">
                                Trial ended
                            </Text>
                            <Text className="text-zinc-400 text-center mb-6">
                                {isOrgAdmin
                                    ? 'Your organization trial has ended. Renew to keep managing screens and media.'
                                    : 'Your organization trial has ended. Contact your admin to subscribe.'}
                            </Text>
                            {isOrgAdmin ? (
                                <Pressable
                                    onPress={openBilling}
                                    disabled={actionsDisabled}
                                    className="rounded-xl bg-primary px-6 py-4 w-full items-center active:opacity-90 disabled:opacity-50 mb-3"
                                >
                                    <Text className="font-sans-semibold text-white">
                                        Renew subscription
                                    </Text>
                                </Pressable>
                            ) : null}
                            <Pressable
                                onPress={handleDownloadData}
                                disabled={actionsDisabled}
                                className="rounded-xl bg-zinc-800 px-6 py-4 w-full items-center active:opacity-90 disabled:opacity-50 mb-3"
                            >
                                {exporting ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#ffffff"
                                    />
                                ) : (
                                    <Text className="font-sans-medium text-white">
                                        Download my data
                                    </Text>
                                )}
                            </Pressable>
                            <Pressable
                                onPress={handleSignOut}
                                disabled={actionsDisabled}
                                className="rounded-xl bg-zinc-800 px-6 py-4 w-full items-center active:opacity-90 disabled:opacity-50"
                            >
                                {signingOut ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#ffffff"
                                    />
                                ) : (
                                    <Text className="font-sans-medium text-white">
                                        Sign out
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    modalContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        paddingHorizontal: 24,
    },
});
