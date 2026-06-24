import { useEffect } from 'react';
import { onNetworkError } from '../lib/api/networkEvents';
import { getUserFriendlyMessage } from '../lib/api';
import { showErrorNotification } from '../lib/notifications/successNotification';

/**
 * Global handler for API/network errors.
 * Subscribes to network error events and shows a push-style notification for each error.
 * Mount once in root layout.
 */
export function NetworkErrorHandler() {
    useEffect(() => {
        const unsubscribe = onNetworkError((error) => {
            void showErrorNotification('Error', getUserFriendlyMessage(error));
        });
        return unsubscribe;
    }, []);

    return null;
}
