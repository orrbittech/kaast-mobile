import { useCallback, useState } from 'react';
import { View, TextInput, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { useLocalCredentials } from '@clerk/clerk-expo/local-credentials';
import type { EmailCodeFactor } from '@clerk/types';
import { Text } from '../../components/ui/Text';
import { colors } from '../../lib/theme/colors';
import { AppleSignInButton } from '../../components/AppleSignInButton';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';

/**
 * Sign-in screen - Clerk useSignIn integration.
 * Email/password sign-in with optional second factor (email code).
 */
export default function SignInScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const { hasCredentials, authenticate, setCredentials, biometricType } =
        useLocalCredentials();
    const router = useRouter();
    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [showEmailCode, setShowEmailCode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onBiometricPress = useCallback(async () => {
        if (!isLoaded || !authenticate || !signIn) return;
        setError(null);
        try {
            const signInAttempt = await authenticate();
            if (signInAttempt?.status === 'complete') {
                await setActive({
                    session: signInAttempt.createdSessionId,
                    navigate: async ({ session }) => {
                        if (session?.currentTask) return;
                        router.replace('/(drawer)');
                    },
                });
            } else if (signInAttempt?.status === 'needs_second_factor') {
                const emailCodeFactor =
                    signInAttempt.supportedSecondFactors?.find(
                        (factor): factor is EmailCodeFactor =>
                            factor.strategy === 'email_code',
                    );
                if (emailCodeFactor) {
                    await signIn.prepareSecondFactor({
                        strategy: 'email_code',
                        emailAddressId: emailCodeFactor.emailAddressId,
                    });
                    setShowEmailCode(true);
                } else {
                    setError('2FA verification method not supported.');
                }
            } else {
                setError('Biometric sign-in incomplete. Please try again.');
            }
        } catch (err) {
            const msg =
                err && typeof err === 'object' && 'errors' in err
                    ? ((err as { errors: { message?: string }[] }).errors?.[0]
                          ?.message ?? 'Biometric sign-in failed')
                    : 'Biometric sign-in failed';
            setError(msg);
        }
    }, [isLoaded, authenticate, signIn, setActive, router]);

    const onSignInPress = useCallback(async () => {
        if (!isLoaded || !signIn) return;
        setError(null);

        try {
            const signInAttempt = await signIn.create({
                identifier: emailAddress,
                password,
            });

            if (signInAttempt.status === 'complete') {
                try {
                    await setCredentials?.({
                        identifier: emailAddress,
                        password,
                    });
                } catch {
                    // Ignore - biometric storage is optional
                }
                await setActive({
                    session: signInAttempt.createdSessionId,
                    navigate: async ({ session }) => {
                        if (session?.currentTask) return;
                        router.replace('/(drawer)');
                    },
                });
            } else if (signInAttempt.status === 'needs_second_factor') {
                const emailCodeFactor =
                    signInAttempt.supportedSecondFactors?.find(
                        (factor): factor is EmailCodeFactor =>
                            factor.strategy === 'email_code',
                    );
                if (emailCodeFactor) {
                    await signIn.prepareSecondFactor({
                        strategy: 'email_code',
                        emailAddressId: emailCodeFactor.emailAddressId,
                    });
                    setShowEmailCode(true);
                }
            } else {
                setError('Sign-in incomplete. Please try again.');
            }
        } catch (err) {
            const msg =
                err && typeof err === 'object' && 'errors' in err
                    ? ((err as { errors: { message?: string }[] }).errors?.[0]
                          ?.message ?? 'Sign-in failed')
                    : 'Sign-in failed';
            setError(msg);
        }
    }, [
        isLoaded,
        signIn,
        setActive,
        setCredentials,
        router,
        emailAddress,
        password,
    ]);

    const onVerifyPress = useCallback(async () => {
        if (!isLoaded || !signIn) return;
        setError(null);

        try {
            const signInAttempt = await signIn.attemptSecondFactor({
                strategy: 'email_code',
                code,
            });

            if (signInAttempt.status === 'complete') {
                await setActive({
                    session: signInAttempt.createdSessionId,
                    navigate: async ({ session }) => {
                        if (session?.currentTask) return;
                        router.replace('/(drawer)');
                    },
                });
            } else {
                setError('Verification incomplete. Please try again.');
            }
        } catch (err) {
            const msg =
                err && typeof err === 'object' && 'errors' in err
                    ? ((err as { errors: { message?: string }[] }).errors?.[0]
                          ?.message ?? 'Verification failed')
                    : 'Verification failed';
            setError(msg);
        }
    }, [isLoaded, signIn, setActive, router, code]);

    if (showEmailCode) {
        return (
            <View className="flex-1 bg-base justify-center items-center px-6">
                <Pressable
                    onPress={() => router.replace('/(onboarding)')}
                    className="absolute top-16 left-6 z-10 p-2 -m-2 rounded-full bg-primary/10 border border-primary"
                >
                    <Ionicons name="arrow-back" size={24} color={colors.primaryHex} />
                </Pressable>
                <View className="w-full max-w-md gap-4">
                    <Text className="text-2xl font-sans-semibold text-white">
                        Verify your email
                    </Text>
                    <Text className="text-zinc-400">
                        A verification code has been sent to your email.
                    </Text>
                    {error ? (
                        <Text className="text-sm text-cancel">{error}</Text>
                    ) : null}
                    <TextInput
                        placeholder="Enter verification code"
                        placeholderTextColor="#a1a1aa"
                        value={code}
                        onChangeText={setCode}
                        style={{ fontFamily: 'Urbanist_400Regular' }}
                        className="mt-4 px-5 py-4 rounded-lg bg-zinc-800 text-white"
                        keyboardType="numeric"
                    />
                    <Pressable
                        onPress={onVerifyPress}
                        disabled={!code}
                        className="mt-4 py-3 rounded-lg bg-primary active:opacity-90 disabled:opacity-50"
                    >
                        <Text className="text-center font-sans-medium text-white">
                            Verify
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-base justify-center items-center px-6">
            <Pressable
                onPress={() => router.replace('/(onboarding)')}
                className="absolute top-16 left-6 z-10 p-2 -m-2 rounded-full bg-primary/10 border border-primary"
            >
                <Ionicons name="arrow-back" size={24} color={colors.primaryHex} />
            </Pressable>
            <View className="w-full max-w-md gap-4">
                <Text className="text-2xl font-sans-semibold text-white">
                    Welcome back
                </Text>
                <Text className="text-zinc-400">
                    Sign in to control your media devices
                </Text>
                {error ? (
                    <Text className="text-sm text-cancel">{error}</Text>
                ) : null}
                <TextInput
                    placeholder="Email"
                    placeholderTextColor="#a1a1aa"
                    value={emailAddress}
                    onChangeText={setEmailAddress}
                    style={{ fontFamily: 'Urbanist_400Regular' }}
                    className="mt-4 px-5 py-4 rounded-lg bg-zinc-800 text-white"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <View className="flex-row items-center rounded-lg bg-zinc-800">
                    <TextInput
                        placeholder="Password"
                        placeholderTextColor="#a1a1aa"
                        value={password}
                        onChangeText={setPassword}
                        style={{ fontFamily: 'Urbanist_400Regular' }}
                        className="flex-1 px-5 py-4 text-white"
                        secureTextEntry={!showPassword}
                    />
                    <Pressable
                        onPress={() => setShowPassword((prev) => !prev)}
                        className="pr-4 py-4"
                        hitSlop={8}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={22}
                            color="#a1a1aa"
                        />
                    </Pressable>
                </View>
                <Link href="/forgot-password" asChild>
                    <Pressable className="self-end">
                        <Text className="text-primary text-sm">
                            Forgot password?
                        </Text>
                    </Pressable>
                </Link>
                {hasCredentials && biometricType ? (
                    <Pressable
                        onPress={onBiometricPress}
                        className="py-3 rounded-lg bg-zinc-800 border border-primary/30 active:opacity-90"
                    >
                        <Text className="text-center font-sans-medium text-white">
                            {biometricType === 'face-recognition'
                                ? 'Sign in with Face ID'
                                : biometricType === 'fingerprint'
                                  ? Platform.OS === 'ios'
                                    ? 'Sign in with Touch ID'
                                    : 'Sign in with fingerprint'
                                  : 'Sign in with biometrics'}
                        </Text>
                    </Pressable>
                ) : null}
                <Pressable
                    onPress={onSignInPress}
                    disabled={!emailAddress || !password}
                    className="py-3 rounded-lg bg-primary active:opacity-90 disabled:opacity-50"
                >
                    <Text className="text-center font-sans-medium text-white">
                        Sign In
                    </Text>
                </Pressable>
                <View className="flex-row items-center gap-3 my-4">
                    <View className="flex-1 h-px bg-zinc-600" />
                    <Text className="text-zinc-500 text-sm">
                        Or continue with
                    </Text>
                    <View className="flex-1 h-px bg-zinc-600" />
                </View>
                <AppleSignInButton />
                <GoogleSignInButton />
                <View className="flex-row justify-center gap-2 mt-4">
                    <Text className="text-zinc-400">
                        Don&apos;t have an account?
                    </Text>
                    <Link href="/sign-up" asChild>
                        <Pressable>
                            <Text className="font-sans-medium text-primary">
                                Sign Up
                            </Text>
                        </Pressable>
                    </Link>
                </View>
            </View>
        </View>
    );
}
