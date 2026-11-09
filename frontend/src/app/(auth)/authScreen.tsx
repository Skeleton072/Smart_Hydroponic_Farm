import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import LoadingModal from "../(modals)/loadingModal";
import { authApi, ApiError } from "@/api/authApi";
import * as SecureStore from "expo-secure-store";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,64}$/;

const PASSWORD_REQUIREMENTS = [
  { id: "length",    label: "At least 8 characters",        test: (p: string) => p.length >= 8 },
  { id: "uppercase", label: "Contains an uppercase letter",  test: (p: string) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "Contains a lowercase letter",  test: (p: string) => /[a-z]/.test(p) },
  { id: "number",    label: "Contains at least one number",  test: (p: string) => /[0-9]/.test(p) },
];

const formatRemaining = (s: number) =>
  `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Something went wrong. Please try again.";
}

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Params from OTP screen (only present when bounced back)
  const params = useLocalSearchParams<{
    email?: string | string[];
    lockUntil?: string | string[];
  }>();
  const prefilledEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const lockUntilRaw   = Array.isArray(params.lockUntil) ? params.lockUntil[0] : params.lockUntil;

  const [isLogin, setIsLogin]         = useState(false);   // bounced users are in signup mode
  const [isLoading, setIsLoading]     = useState(false);
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState(prefilledEmail ?? "");
  const [password, setPassword]       = useState("");
  const [showPassword, setShow]       = useState(false);
  const [serverError, setServerError] = useState("");

  const [lockUntil, setLockUntil] = useState<number>(() => {
    const parsed = Number(lockUntilRaw);
    return Number.isFinite(parsed) ? parsed : 0;
  });
  const [now, setNow] = useState<number>(Date.now());

  const lockRemainingSec = useMemo(() => {
    const ms = lockUntil - now;
    return ms > 0 ? Math.ceil(ms / 1000) : 0;
  }, [lockUntil, now]);

  const isLockedOut = lockRemainingSec > 0;

  useEffect(() => {
    if (!isLockedOut) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [isLockedOut]);

  useEffect(() => {
    if (lockUntil > 0 && lockRemainingSec === 0) {
      setLockUntil(0);
    }
  }, [lockUntil, lockRemainingSec]);

  // Derived validation
  const isEmailValid    = useMemo(() => EMAIL_REGEX.test(email.trim()), [email]);
  const isPasswordValid = useMemo(() => PASSWORD_REGEX.test(password), [password]);
  const isNameValid     = useMemo(() => name.trim().length > 0, [name]);

  const isFormValid = useMemo(() => {
    if (isLockedOut) return false;
    if (isLogin) return isEmailValid && password.length > 0;
    return isEmailValid && isPasswordValid && isNameValid;
  }, [isLockedOut, isLogin, isEmailValid, isPasswordValid, isNameValid, password]);

  const clearError = useCallback(() => setServerError(""), []);

  const handleTabSwitch = useCallback((loginMode: boolean) => {
    setIsLogin(loginMode);
    setName("");
    setEmail("");
    setPassword("");
    setServerError("");
  }, []);

  const handleSubmit = async () => {
    if (!isFormValid || isLoading || isLockedOut) return;
    setIsLoading(true);
    setServerError("");

    try {
      if (isLogin) {
        const res = await authApi.login({ email: email.trim().toLowerCase(), password });

        await SecureStore.setItemAsync("accessToken", res.data.accessToken);
        await SecureStore.setItemAsync("refreshToken", res.data.refreshToken);

        router.replace("/(tabs)");
      } else {
        await authApi.signup({
          user_name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
        router.replace({
          pathname: "/(auth)/otpScreen",
          params: { email: email.trim().toLowerCase() },
        });
      }
    } catch (err) {
      // If signup itself is rate-limited (server returns 429 + retryAfter), show countdown here too.
      if (err instanceof ApiError && err.status === 429 && err.retryAfter) {
        setLockUntil(Date.now() + err.retryAfter * 1000);
        setNow(Date.now());
        setServerError("");
      } else {
        setServerError(getErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showRequirements = !isLogin && password.length > 0;
  
  console.log(isLockedOut);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LoadingModal visible={isLoading} message="Please wait..." />

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#f9fafb" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-surface p-8 rounded-3xl shadow-lg border border-gray-200">
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-main">
                {isLogin ? "Welcome Back" : "Create Account"}
              </Text>
              <Text className="text-muted text-sm mt-1">
                {isLogin ? "Sign in to access your account" : "Sign up to get started"}
              </Text>
            </View>

            <View className="flex-row bg-background p-1 rounded-pill mb-6">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-pill items-center ${isLogin ? "bg-primary" : "bg-transparent"}`}
                onPress={() => handleTabSwitch(true)}
                disabled={isLockedOut}
              >
                <Text className={`font-semibold ${isLogin ? "text-surface" : "text-muted"}`}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-pill items-center ${!isLogin ? "bg-primary" : "bg-transparent"}`}
                onPress={() => handleTabSwitch(false)}
                disabled={isLockedOut}
              >
                <Text className={`font-semibold ${!isLogin ? "text-surface" : "text-muted"}`}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Lockout banner */}
            {isLockedOut ? (
              <View className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <Text className="text-amber-700 text-sm text-center font-medium">
                  Too many incorrect attempts. Please try again in{" "}
                  <Text className="font-bold">{formatRemaining(lockRemainingSec)}</Text>.
                </Text>
              </View>
            ) : serverError ? (
              <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <Text className="text-red-600 text-sm text-center">{serverError}</Text>
              </View>
            ) : null}

            {!isLogin && (
              <View className="mb-4">
                <Text className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">Full Name</Text>
                <TextInput
                  className="bg-background border border-gray-300 text-main px-4 py-3.5 rounded-xl text-base"
                  placeholder="John Doe"
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading && !isLockedOut}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  value={name}
                  onChangeText={(t) => { setName(t); clearError(); }}
                />
              </View>
            )}

            <View className="mb-4">
              <Text className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">Email Address</Text>
              <View
                className={`flex-row items-center bg-background border rounded-xl px-4 ${
                  email.length > 0
                    ? isEmailValid ? "border-emerald-500" : "border-red-400"
                    : "border-gray-300"
                }`}
              >
                <TextInput
                  className="flex-1 py-3.5 text-main text-base"
                  placeholder="name@example.com"
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading && !isLockedOut}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearError(); }}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">Password</Text>
              <View
                className={`flex-row items-center bg-background border rounded-xl px-4 ${
                  password.length > 0 && !isLogin
                    ? isPasswordValid ? "border-emerald-500" : "border-gray-300"
                    : "border-gray-300"
                }`}
              >
                <TextInput
                  className="flex-1 py-3.5 text-main text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading && !isLockedOut}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  textContentType={isLogin ? "password" : "newPassword"}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearError(); }}
                />
                <TouchableOpacity
                  onPress={() => setShow((s) => !s)}
                  activeOpacity={0.7}
                  style={{ marginLeft: 8 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#4b5563" />
                </TouchableOpacity>
              </View>

              {showRequirements && (
                <View className="mt-3">
                  {PASSWORD_REQUIREMENTS.map((req) => {
                    const passed = req.test(password);
                    return (
                      <View key={req.id} className="flex-row items-center mt-2">
                        <Ionicons
                          name={passed ? "checkmark-circle" : "ellipse-outline"}
                          size={16}
                          color={passed ? "#10b981" : "#9ca3af"}
                        />
                        <Text className={`ml-2 text-xs ${passed ? "text-emerald-600 font-medium" : "text-gray-400"}`}>
                          {req.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <TouchableOpacity
              className={`py-4 rounded-pill items-center shadow-md mb-4 ${
                isFormValid && !isLoading ? "bg-primary active:bg-primary-hover" : "bg-gray-200 opacity-60"
              }`}
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading || isLockedOut}
            >
              <Text className={`font-bold text-base ${isFormValid ? "text-surface" : "text-gray-400"}`}>
                {isLoading
                  ? "Please wait..."
                  : isLockedOut
                  ? `Try again in ${formatRemaining(lockRemainingSec)}`
                  : isLogin
                  ? "Login"
                  : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <View className="h-1.5 w-12 bg-accent rounded-pill self-center mt-2" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}