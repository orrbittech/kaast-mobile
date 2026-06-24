import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { Text } from '../../components/ui/Text';
import { AppleSignInButton } from '../../components/AppleSignInButton';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';

/**
 * Sign-up screen - Clerk useSignUp integration.
 * Email/password sign-up with email verification code.
 */
export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();
    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSignUpPress = async () => {
        if (!isLoaded || !signUp) return;
        setError(null);

        try {
            await signUp.create({
                emailAddress,
                password,
            });
            await signUp.prepareEmailAddressVerification({
                strategy: 'email_code',
            });
            setPendingVerification(true);
        } catch (err) {
            const msg =
                err && typeof err === 'object' && 'errors' in err
                    ? ((err as { errors: { message?: string }[] }).errors?.[0]
                          ?.message ?? 'Sign-up failed')
                    : 'Sign-up failed';
            setError(msg);
        }
    };

    const onVerifyPress = async () => {
        if (!isLoaded || !signUp) return;
        setError(null);

        try {
            const signUpAttempt = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (signUpAttempt.status === 'complete') {
                await setActive({
                    session: signUpAttempt.createdSessionId,
                    navigate: async ({ session }) => {
                        if (session?.currentTask) {
                            return;
                        }
                        router.replace('/');
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
    };

    if (pendingVerification) {
        return (
            <View className="flex-1 bg-base justify-center items-center px-6">
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
            <View className="w-full max-w-md gap-4">
                <Text className="text-2xl font-sans-semibold text-white">
                    Create account
                </Text>
                <Text className="text-zinc-400">
                    Sign up to get started with Kaast media control
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
                <Pressable
                    onPress={onSignUpPress}
                    disabled={!emailAddress || !password}
                    className="mt-4 py-3 rounded-lg bg-primary active:opacity-90 disabled:opacity-50"
                >
                    <Text className="text-center font-sans-medium text-white">
                        Sign Up
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
                        Already have an account?
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
