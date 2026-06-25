import { useEffect } from 'react';
import { Alert } from 'react-native';
import { getClerkInstance } from '@clerk/clerk-expo';
import { onNetworkError } from '../lib/api/networkEvents';
import { getUserFriendlyMessage, isSubscriptionRequiredError } from '../lib/api';
import { showErrorNotification } from '../lib/notifications/successNotification';
import {
    AccountPortalConfigError,
    openAccountPortalBillingAsync,
} from '../lib/openAccountPortal';

/**
 * Global handler for API/network errors.
 * Subscribes to network error events and shows a push-style notification for each error.
 * Subscription errors redirect to the Clerk Account Portal instead of showing a toast.
 * Mount once in root layout.
 */
export function NetworkErrorHandler() {
    useEffect(() => {
        const unsubscribe = onNetworkError((error) => {
            if (isSubscriptionRequiredError(error)) {
                const orgId = getClerkInstance().organization?.id;
                void openAccountPortalBillingAsync(orgId).catch((err: unknown) => {
                    const message =
                        err instanceof AccountPortalConfigError
                            ? err.message
                            : 'Could not open billing. Please try again.';
                    Alert.alert('Not configured', message, [{ text: 'OK' }]);
                });
                return;
            }
            void showErrorNotification('Error', getUserFriendlyMessage(error));
        });
        return unsubscribe;
    }, []);

    return null;
}
