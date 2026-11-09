import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
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
import { authApi } from "@/api/authApi";

const LOCK_TEMPORARY = 166;
const LOCK_BLOCKED_SELF_UNLOCK = 141;
const LOCK_BLOCKED_ADMIN = 138;

type LockState =
  | { type: "none" }
  | { type: "temporary"; remainingSeconds: number }
  | { type: "permanent"; canSelfUnlock: boolean; message?: string };

export default function OtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isError, setIsError] = useState<boolean>(false);
  const [lock, setLock] = useState<LockState>({ type: "none" });
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const inputRefs = useRef<(React.ElementRef<typeof RNTextInput> | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Countdown timer for temporary lockout
  useEffect(() => {
    if (lock.type !== "temporary") return;

    setRemainingSeconds(lock.remainingSeconds);
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLock({ type: "none" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lock]);

  const formatRemaining = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isLocked = lock.type !== "none";
  const isTemporaryLock = lock.type === "temporary";
  const isPermanentLock = lock.type === "permanent";

  const triggerShakeAndError = () => {
    setIsError(true);

    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      setIsError(false);
    }, 500);
  };

  const applyLock = (status: number, data?: any) => {
    if (status === 429) {
      const retryAfter = data?.retryAfter ?? 60;
      setLock({ type: "temporary", remainingSeconds: retryAfter });
      return true;
    }

    if (status === 403) {
      setLock({
        type: "permanent",
        canSelfUnlock: false,
        message: data?.message ?? "Your account has been blocked. Please contact support.",
      });
      return true;
    }

    // if (status === LOCK_BLOCKED_SELF_UNLOCK) {
    //   setLock({
    //     type: "permanent",
    //     canSelfUnlock: true,
    //     message: data?.message ?? "Your account is blocked. You can reset it to unlock.",
    //   });
    //   return true;
    // }

    // if (status === LOCK_BLOCKED_ADMIN) {
    //   setLock({
    //     type: "permanent",
    //     canSelfUnlock: false,
    //     message: data?.message ?? "Your account is blocked. Please contact the administrator.",
    //   });
    //   return true;
    // }
    return false;
  };

  const handleChangeText = (text: string, index: number) => {
    if (isLocked) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  async function handleVerify() {
    if (isLocked) return;

    const code = otp.join("");

    if (code.length < 6) {
      triggerShakeAndError();
      return;
    }

    setIsLoading(true);

    try {
      const { status, data } = await authApi.verifyOtp({ email, otp: code });
      console.log("otpScreen: ", status);
      console.log("otpScreen: ", data);

      if (status === 200 || status === 201) {
        router.replace("/(tabs)");
        return;
      }

      if (applyLock(status, data)) {
        setOtp(["", "", "", "", "", ""]);
        return;
      }

      triggerShakeAndError();
      setTimeout(() => {
        setOtp(["", "", "", "", "", ""]);
      }, 500);
    } catch (error: any) {
      // Some APIs surface lock state via error.response
      const status = error?.response?.status;
      const data = error?.response?.data;

      console.log("Catch block: ");
      console.log("status: ", status);
      console.log("data  : ", data);

      if (status && applyLock(status, data)) {
        setOtp(["", "", "", "", "", ""]);
        return;
      }

      if (status == 410) { // OTP expired
        router.back();
        return;
      }

      triggerShakeAndError();
      setTimeout(() => {
        setOtp(["", "", "", "", "", ""]);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOTP() {
    if (isLocked) return;

    try {
      const { status, data } = await authApi.resendOtp({ email });

      if (applyLock(status, data)) return;

      if (status === 200) {
        console.log("OTP code resent successfully");
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      if (status && applyLock(status, data)) return;

      if (status == 410) { // OTP expired
        router.back();
        return;
      }

      console.log("Error: ", error.message);
    }
  }

  const onBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <LoadingModal visible={isLoading} message="Verifying OTP. Please wait..." />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-background justify-center px-6"
      >
        <View className="bg-surface py-8 px-2 rounded-3xl shadow-lg border border-gray-200 flex flex-col items-center">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mb-4">
              <View className="w-6 h-6 bg-accent rounded-full" />
            </View>
            <Text className="text-3xl font-bold text-main text-center">
              Verify Code
            </Text>
            <Text className="text-muted text-sm mt-2 text-center">
              We've sent a 6-digit verification code to{" "}
              <Text className="text-main font-semibold">
                {email || "your email"}
              </Text>
            </Text>
          </View>

          {/* OTP Input Boxes wrapped with Shake Animation */}
          <Animated.View
            style={{ transform: [{ translateX: shakeAnimation }] }}
            className="flex-col items-center justify-between gap-2 mb-8 w-full"
          >
            <View className="flex-row items-center justify-between w-full">
              {otp.slice(0, 3).map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  editable={!isLocked}
                  className={`w-12 h-14 bg-background border text-main text-center text-xl font-bold rounded-xl focus:border-black ${
                    isError ? "border-red-500 bg-red-50" : "border-gray-300"
                  } ${isLocked ? "opacity-50" : ""}`}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) => handleChangeText(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}

              <View className="items-center justify-center">
                <Ionicons name="remove" size={17} color="#9ca3af" />
              </View>

              {otp.slice(3, 6).map((digit, index) => {
                const actualIndex = index + 3;
                return (
                  <TextInput
                    key={actualIndex}
                    ref={(el) => {
                      inputRefs.current[actualIndex] = el;
                    }}
                    editable={!isLocked}
                    className={`w-12 h-14 bg-background border text-main text-center text-xl font-bold rounded-xl focus:border-black ${
                      isError ? "border-red-500 bg-red-50" : "border-gray-300"
                    } ${isLocked ? "opacity-50" : ""}`}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={(text) => handleChangeText(text, actualIndex)}
                    onKeyPress={(e) => handleKeyPress(e, actualIndex)}
                  />
                );
              })}
            </View>

            {/* Incorrect code error */}
            {isError && !isLocked && (
              <Text className="text-red-500 text-xs text-center mt-2 font-medium">
                Incorrect verification code. Please try again.
              </Text>
            )}

            {/* Temporary lockout notice with countdown */}
            {isTemporaryLock && (
              <Text className="text-amber-600 text-xs text-center mt-2 font-medium">
                Too many attempts. Try again in{" "}
                {formatRemaining(remainingSeconds)}.
              </Text>
            )}

            {/* Permanent block notice */}
            {isPermanentLock && (
              <Text className="text-red-600 text-xs text-center mt-2 font-medium">
                {lock.message}
              </Text>
            )}
          </Animated.View>

          {/* Verify Button */}
          {!isPermanentLock && (
            <TouchableOpacity
              disabled={isLocked}
              className={`p-4 w-[80%] rounded-pill items-center shadow-md mb-6 ${
                isLocked
                  ? "bg-gray-300"
                  : "bg-primary active:bg-primary-hover"
              }`}
              onPress={handleVerify}
            >
              <Text
                className={`font-bold text-base ${
                  isLocked ? "text-gray-500" : "text-surface"
                }`}
              >
                {isTemporaryLock
                  ? `Locked (${formatRemaining(remainingSeconds)})`
                  : "Verify & Proceed"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Resend & Back links */}
          <View className="items-center space-y-2">
            {isPermanentLock && lock.canSelfUnlock ? (
              <TouchableOpacity
                onPress={() => {
                  // TODO: navigate to your unlock/reset flow
                  router.push("/unlock" as any);
                }}
                className="mt-2"
              >
                <Text className="text-primary font-medium text-sm underline">
                  Unlock my account
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-primary font-medium text-sm">
                Didn't receive the code?{" "}
                <TouchableOpacity
                  disabled={isLocked}
                  onPress={handleResendOTP}
                >
                  <Text
                    className={`underline decoration-solid ${
                      isLocked
                        ? "color-gray-400 decoration-gray-400"
                        : "color-red-500 decoration-red-900"
                    }`}
                  >
                    Resend
                  </Text>
                </TouchableOpacity>
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