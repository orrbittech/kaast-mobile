import { useCallback, useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { Text } from '../../components/ui/Text';

/**
 * Forgot password - request reset code, then enter code + new password.
 * Uses Clerk's reset_password_email_code strategy.
 */
export default function ForgotPasswordScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [error, setError] = useState<string | null>(null);

    const onRequestCode = useCallback(async () => {
        if (!isLoaded || !signIn) return;
        setError(null);

        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: email,
            });
            setStep('reset');
        } catch (err) {
            const msg =
                err && typeof err === 'object' && 'errors' in err
                    ? ((err as { errors: { message?: string }[] }).errors?.[0]
                          ?.message ?? 'Failed to send reset code')
                    : 'Failed to send reset code';
            setError(msg);
        }
    }, [isLoaded, signIn, email]);

    const onResetPassword = useCallback(async () => {
        if (!isLoaded || !signIn) return;
        setError(null);

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
                password,
            });

            if (result.status === 'complete') {
                await setActive({
                    session: result.createdSessionId,
                    navigate: async ({ session }) => {
                        if (session?.currentTask) return;
                        router.replace('/(drawer)');
                    },
                });
            } else {
                setError('Reset incomplete. Please try again.');
            }
        } catch (err) {
            const msg =
                err && typeof err === 'object' && 'errors' in err
                    ? ((err as { errors: { message?: string }[] }).errors?.[0]
                          ?.message ?? 'Failed to reset password')
                    : 'Failed to reset password';
            setError(msg);
        }
    }, [isLoaded, signIn, setActive, router, code, password]);

    if (step === 'reset') {
        return (
            <View className="flex-1 bg-base justify-center items-center px-6">
                <View className="w-full max-w-md gap-4">
                    <Text className="text-2xl font-sans-semibold text-white text-center">
                        Reset password
                    </Text>
                    <Text className="text-zinc-400 text-center">
                        Enter the code sent to {email} and your new password.
                    </Text>
                    {error ? (
                        <Text className="text-sm text-cancel text-center">
                            {error}
                        </Text>
                    ) : null}
                    <TextInput
                        placeholder="Verification code"
                        placeholderTextColor="#a1a1aa"
                        value={code}
                        onChangeText={setCode}
                        style={{ fontFamily: 'Urbanist_400Regular' }}
                        className="px-5 py-4 rounded-lg bg-zinc-800 text-white"
                        keyboardType="numeric"
                    />
                    <TextInput
                        placeholder="New password"
                        placeholderTextColor="#a1a1aa"
                        value={password}
                        onChangeText={setPassword}
                        style={{ fontFamily: 'Urbanist_400Regular' }}
                        className="px-5 py-4 rounded-lg bg-zinc-800 text-white"
                        secureTextEntry
                    />
                    <Pressable
                        onPress={onResetPassword}
                        disabled={!code || !password}
                        className="py-3 rounded-lg bg-primary active:opacity-90 disabled:opacity-50"
                    >
                        <Text className="text-center font-sans-medium text-white">
                            Reset Password
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setStep('email')}
                        className="self-center"
                    >
                        <Text className="text-primary">
                            Use a different email
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-base justify-center items-center px-6">
            <View className="w-full max-w-md gap-4">
                <Text className="text-2xl font-sans-semibold text-white text-center">
                    Forgot password?
                </Text>
                <Text className="text-zinc-400 text-center">
                    Enter your email and we&apos;ll send you a reset code.
                </Text>
                {error ? (
                    <Text className="text-sm text-cancel text-center">
                        {error}
                    </Text>
                ) : null}
                <TextInput
                    placeholder="Email"
                    placeholderTextColor="#a1a1aa"
                    value={email}
                    onChangeText={setEmail}
                    style={{ fontFamily: 'Urbanist_400Regular' }}
                    className="px-5 py-4 rounded-lg bg-zinc-800 text-white"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <Pressable
                    onPress={onRequestCode}
                    disabled={!email}
                    className="py-3 rounded-lg bg-primary active:opacity-90 disabled:opacity-50"
                >
                    <Text className="text-center font-sans-medium text-white">
                        Send reset code
                    </Text>
                </Pressable>
                <View className="flex-row justify-center gap-2">
                    <Text className="text-zinc-400">
                        Remember your password?
                    </Text>
                    <Link href="/sign-in" asChild>
                        <Pressable>
                            <Text className="font-sans-medium text-primary">
                                Sign In
                            </Text>
                        </Pressable>
                    </Link>
                </View>
            </View>
        </View>
    );
}
