import { Redirect } from 'expo-router';

/**
 * Reset password - Clerk handles reset via email link.
 * Deep link target: app opens with token in URL.
 * For now, redirect to forgot-password for the code-based flow.
 */
export default function ResetPasswordScreen() {
    return <Redirect href="/forgot-password" />;
}
