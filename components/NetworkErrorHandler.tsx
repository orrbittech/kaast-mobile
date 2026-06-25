import { useEffect } from 'react';
import { onNetworkError } from '../lib/api/networkEvents';
import { getUserFriendlyMessage, isSubscriptionRequiredError } from '../lib/api';
import { showErrorNotification } from '../lib/notifications/successNotification';

/**
 * Global handler for API/network errors.
 * Subscription errors are handled by TrialExpiredGate — no auto portal redirect.
 */
export function NetworkErrorHandler() {
    useEffect(() => {
        const unsubscribe = onNetworkError((error) => {
            if (isSubscriptionRequiredError(error)) {
                return;
            }
            void showErrorNotification('Error', getUserFriendlyMessage(error));
        });
        return unsubscribe;
    }, []);

    return null;
}
