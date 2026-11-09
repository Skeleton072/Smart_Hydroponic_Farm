import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LoadingModal from "../(modals)/loadingModal";
import { authApi, ApiError } from "@/api/authApi";
import * as SecureStore from "expo-secure-store";

type LockState =
  | { type: "none" }
  | { type: "temporary"; remainingSeconds: number }
  | { type: "permanent"; canSelfUnlock: boolean; message?: string };

const formatRemaining = (s: number) =>
  `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [lock, setLock] = useState<LockState>({ type: "none" });
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const inputRefs = useRef<(React.ElementRef<typeof RNTextInput> | null)[]>([]);
  const shake = useRef(new Animated.Value(0)).current;

  // Countdown
  useEffect(() => {
    if (lock.type !== "temporary") return;
    setRemainingSeconds(lock.remainingSeconds);

    const id = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setLock({ type: "none" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [lock]);

  const isLocked = lock.type !== "none";
  const isTemporaryLock = lock.type === "temporary";
  const isPermanentLock = lock.type === "permanent";

  const shakeAndError = useCallback((message: string) => {
    setIsError(true);
    setErrorMessage(message);

    Animated.sequence([
      Animated.timing(shake, { toValue: 10,  duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10,  duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,   duration: 50, useNativeDriver: true }),
    ]).start();

    setTimeout(() => setIsError(false), 500);
  }, [shake]);

  const resetOtp = useCallback(() => {
    setOtp(["", "", "", "", "", ""]);
    // Refocus the first box after the reset has been committed.
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 0);
  }, []);

  // Centralized server-error handling
  const applyServerError = useCallback((err: ApiError): boolean => {
    if (err.status === 429) {
      const retry = err.retryAfter ?? 60;
      // setLock({ type: "temporary", remainingSeconds: retry });
      resetOtp();

      router.replace({
        pathname: "/(auth)/authScreen",
        params: {
          email,
          lockUntil: String(Date.now() + retry * 1000),
        },
      });
      return true;
    }

    if (err.status === 403) {
      setLock({
        type: "permanent",
        canSelfUnlock: false,
        message: err.message,
      });
      return true;
    }

    if (err.status === 410) {
      router.replace({
        pathname: "/(auth)/authScreen",
        params: email ? { email } : {},
      });
      return true;
    }

    return false;
  }, [resetOtp, router]);

  const handleChangeText = (text: string, index: number) => {
    if (isLocked) return;
    const digit = text.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (isLocked || isLoading) return;

    const code = otp.join("");
    if (code.length < 6) {
      shakeAndError("Please enter the full 6-digit code.");
      return;
    }

    if (!email) {
      setLock({ type: "permanent", canSelfUnlock: false, message: "Missing email. Please sign up again." });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp({ email, otp: code });

      await SecureStore.setItemAsync("accessToken", res.data.accessToken);
      await SecureStore.setItemAsync("refreshToken", res.data.refreshToken);

      router.replace("/(tabs)");
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError(0, "Network error.");
      if (applyServerError(apiErr)) return;
      shakeAndError(apiErr.message || "Incorrect verification code.");
      setTimeout(resetOtp, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (isLocked || isLoading || !email) return;
    setIsLoading(true);
    try {
      await authApi.resendOtp({ email });
      setErrorMessage("A new code has been sent.");
      setIsError(false);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError(0, "Network error.");
      if (applyServerError(apiErr)) return;
      shakeAndError(apiErr.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onBack = () => router.back();

  const renderBox = (index: number) => (
    <TextInput
      key={index}
      ref={(el) => { inputRefs.current[index] = el; }}
      editable={!isLocked}
      className={`w-12 h-14 bg-background border text-main text-center text-xl font-bold rounded-xl focus:border-black ${
        isError ? "border-red-500 bg-red-50" : "border-gray-300"
      } ${isLocked ? "opacity-50" : ""}`}
      maxLength={1}
      keyboardType="number-pad"
      autoComplete="sms-otp"
      textContentType="oneTimeCode"
      value={otp[index]}
      onChangeText={(t) => handleChangeText(t, index)}
      onKeyPress={(e) => handleKeyPress(e, index)}
    />
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LoadingModal visible={isLoading} message="Verifying OTP. Please wait..." />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-background justify-center px-6"
      >
        <View className="bg-surface py-8 px-2 rounded-3xl shadow-lg border border-gray-200 flex flex-col items-center">
          <View className="items-center mb-8">
            <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mb-4">
              <View className="w-6 h-6 bg-accent rounded-full" />
            </View>
            <Text className="text-3xl font-bold text-main text-center">Verify Code</Text>
            <Text className="text-muted text-sm mt-2 text-center">
              We've sent a 6-digit verification code to{" "}
              <Text className="text-main font-semibold">{email || "your email"}</Text>
            </Text>
          </View>

          <Animated.View
            style={{ transform: [{ translateX: shake }] }}
            className="flex-col items-center justify-between gap-2 mb-8 w-full"
          >
            <View className="flex-row items-center justify-between w-full">
              {[0, 1, 2].map(renderBox)}
              <View className="items-center justify-center">
                <Ionicons name="remove" size={17} color="#9ca3af" />
              </View>
              {[3, 4, 5].map(renderBox)}
            </View>

            {isError && !isLocked && (
              <Text className="text-red-500 text-xs text-center mt-2 font-medium">
                {errorMessage || "Incorrect verification code. Please try again."}
              </Text>
            )}

            {isTemporaryLock && (
              <Text className="text-amber-600 text-xs text-center mt-2 font-medium">
                Too many attempts. Try again in {formatRemaining(remainingSeconds)}.
              </Text>
            )}

            {isPermanentLock && (
              <Text className="text-red-600 text-xs text-center mt-2 font-medium">
                {lock.message}
              </Text>
            )}
          </Animated.View>

          {!isPermanentLock && (
            <TouchableOpacity
              disabled={isLocked || isLoading}
              className={`p-4 w-[80%] rounded-pill items-center shadow-md mb-6 ${
                isLocked ? "bg-gray-300" : "bg-primary active:bg-primary-hover"
              }`}
              onPress={handleVerify}
            >
              <Text className={`font-bold text-base ${isLocked ? "text-gray-500" : "text-surface"}`}>
                {isTemporaryLock
                  ? `Locked (${formatRemaining(remainingSeconds)})`
                  : "Verify & Proceed"}
              </Text>
            </TouchableOpacity>
          )}

          <View className="items-center space-y-2">
            {isPermanentLock && lock.canSelfUnlock ? (
              <TouchableOpacity onPress={() => router.push("/unlock" as any)} className="mt-2">
                <Text className="text-primary font-medium text-sm underline">Unlock my account</Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-primary font-medium text-sm">
                Didn't receive the code?{" "}
                <Text
                  onPress={isLocked || isLoading ? undefined : handleResendOTP}
                  className={`underline decoration-solid ${
                    isLocked ? "color-gray-400 decoration-gray-400" : "color-red-500 decoration-red-900"
                  }`}
                >
                  Resend
                </Text>
              </Text>
            )}

            <TouchableOpacity onPress={onBack} className="mt-3">
              <Text className="text-muted text-xs">Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}