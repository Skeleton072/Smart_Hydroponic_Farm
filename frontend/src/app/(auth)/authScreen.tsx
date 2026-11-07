import { Stack, useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
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
import axios, { AxiosError } from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import LoadingModal from "../(modals)/loadingModal";
import { authApi } from "@/api/authApi";

// --- Constants & Validation ---
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

interface PasswordRequirement {
  id: string;
  label: string;
  test: (pass: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "uppercase", label: "Contains an uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "Contains a lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "Contains at least one number", test: (p) => /[0-9]/.test(p) },
];

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ message?: string }>;

    if (axiosErr.code === 'ECONNABORTED' || !axiosErr.response) {
      return "Request timed out or network error. Please check your connection and try again.";
    }

    return (
      axiosErr.response.data?.message ??
      `Request failed (${axiosErr.response.status}). Please try again.`
    );
  }
  
  return "Something went wrong. Please try again.";
}

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((state) => state.signIn);

  // Form State
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>("");

  // Derived Validation
  const isEmailValid = useMemo(() => EMAIL_REGEX.test(email), [email]);
  const isPasswordValid = useMemo(() => PASSWORD_REGEX.test(password), [password]);
  
  const isFormValid = useMemo(() => {
    if (isLogin) {
      return isEmailValid && isPasswordValid;
    }

    return isEmailValid && isPasswordValid && name.trim().length > 0;
  }, [isLogin, isEmailValid, isPasswordValid, name]);

  const handleTabSwitch = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setName("");
    setEmail("");
    setPassword("");
    setServerError("");
  };

  const handleSubmit = async () => {
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    setServerError("");

    try {
      if (isLogin) {
        // api call
        const data = await authApi.login({ email, password });

        // store user_id in local
        await signIn(data.user_id);
        router.replace("/(tabs)");
      } else {
        // await authApi.signup({ user_name: name.trim(), email, password });
        router.push({
          pathname: "/(auth)/otpScreen",
          params: { email },
        });
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <LoadingModal visible={isLoading} message="Please wait..."/>

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
            
            {/* Header */}
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-main">
                {isLogin ? "Welcome Back" : "Create Account"}
              </Text>
              <Text className="text-muted text-sm mt-1">
                {isLogin ? "Sign in to access your account" : "Sign up to get started"}
              </Text>
            </View>

            {/* Tab Toggle */}
            <View className="flex-row bg-background p-1 rounded-pill mb-6">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-pill items-center ${isLogin ? "bg-primary" : "bg-transparent"}`}
                onPress={() => handleTabSwitch(true)}
              >
                <Text className={`font-semibold ${isLogin ? "text-surface" : "text-muted"}`}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-pill items-center ${!isLogin ? "bg-primary" : "bg-transparent"}`}
                onPress={() => handleTabSwitch(false)}
              >
                <Text className={`font-semibold ${!isLogin ? "text-surface" : "text-muted"}`}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Server Error Banner */}
            {serverError ? (
              <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <Text className="text-red-600 text-sm text-center">{serverError}</Text>
              </View>
            ) : null}

            {/* Full Name Field (Sign Up Only) */}
            {!isLogin && (
              <View className="mb-4">
                <Text className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">
                  Full Name
                </Text>
                <TextInput
                  className="bg-background border border-gray-300 text-main px-4 py-3.5 rounded-xl text-base"
                  placeholder="John Doe"
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            {/* Email Field */}
            <View className="mb-4">
              <Text className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">
                Email Address
              </Text>
              <View
                className={`flex-row items-center bg-background border rounded-xl px-4 ${
                  email.length > 0
                    ? isEmailValid
                      ? "border-emerald-500"
                      : "border-red-400"
                    : "border-gray-300"
                }`}
              >
                <TextInput
                  className="flex-1 py-3.5 text-main text-base"
                  placeholder="name@example.com"
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="mb-6">
              <Text className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">
                Password
              </Text>
              <View
                className={`flex-row items-center bg-background border rounded-xl px-4 ${
                  password.length > 0
                    ? isPasswordValid
                      ? "border-emerald-500"
                      : "border-gray-300"
                    : "border-gray-300"
                }`}
              >
                <TextInput
                  className="flex-1 py-3.5 text-main text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  style={{ marginLeft: 8 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#4b5563"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Validation Requirements Checklist */}
              <View className="mt-3 space-y-1.5">
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const passed = req.test(password);
                  return (
                    <View key={req.id} className="flex-row items-center mt-2">
                      <Ionicons
                        name={passed ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={passed ? "#10b981" : "#9ca3af"}
                      />
                      <Text
                        className={`ml-2 text-xs ${
                          passed ? "text-emerald-600 font-medium" : "text-gray-400"
                        }`}
                      >
                        {req.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Single Action Button */}
            <TouchableOpacity
              className={`py-4 rounded-pill items-center shadow-md mb-4 ${
                isFormValid && !isLoading
                  ? "bg-primary active:bg-primary-hover"
                  : "bg-gray-200 opacity-60"
              }`}
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
            >
              <Text
                className={`font-bold text-base ${
                  isFormValid ? "text-surface" : "text-gray-400"
                }`}
              >
                {isLoading
                  ? "Please wait..."
                  : isLogin
                  ? "Login"
                  : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {/* Accent indicator bar */}
            <View className="h-1.5 w-12 bg-accent rounded-pill self-center mt-2" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}