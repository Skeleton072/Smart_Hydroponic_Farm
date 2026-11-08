import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useRef } from "react";
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

export default function OtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isError, setIsError] = useState<boolean>(false);

  const inputRefs = useRef<(React.ElementRef<typeof RNTextInput> | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const triggerShakeAndError = () => {
    setIsError(true);

    // Sequence of animations to create a swift shake effect
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    // Revert border color back to original after 500ms
    setTimeout(() => {
      setIsError(false);
    }, 500);
  };

  const handleChangeText = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance input focus
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
    const code = otp.join("");
    console.log(code);
    if (code.length < 6) {
      triggerShakeAndError();
      return;
    }

    setIsLoading(true);

    try {
      const status = await authApi.verifyOtp({ email, otp: code });
      console.log(status);
      if (status === 200 || status === 201) {
        router.replace("/(tabs)");
      } else {
        triggerShakeAndError();
        setTimeout(() => {
          setOtp(["", "", "", "", "", ""]);
        }, 500);
      }
    } catch (error: any) {
      triggerShakeAndError();
      setTimeout(() => {
        setOtp(["", "", "", "", "", ""]);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  }

  const onBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <LoadingModal visible={isLoading} message="Verifying OTP. Please wait..."/>

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
              {/* First 3 digits */}
              {otp.slice(0, 3).map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  className={`w-12 h-14 bg-background border text-main text-center text-xl font-bold rounded-xl focus:border-black  ${
                    isError ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) => handleChangeText(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}

              {/* Dash Separator Icon */}
              <View className="items-center justify-center">
                <Ionicons name="remove" size={17} color="#9ca3af" />
              </View>

              {/* Last 3 digits */}
              {otp.slice(3, 6).map((digit, index) => {
                const actualIndex = index + 3;
                return (
                  <TextInput
                    key={actualIndex}
                    ref={(el) => {
                      inputRefs.current[actualIndex] = el;
                    }}
                    className={`w-12 h-14 bg-background border text-main text-center text-xl font-bold rounded-xl focus:border-black ${
                      isError ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={(text) => handleChangeText(text, actualIndex)}
                    onKeyPress={(e) => handleKeyPress(e, actualIndex)}
                  />
                );
              })}
            </View>

            {/* Error Message Display */}
            {isError && (
              <Text className="text-red-500 text-xs text-center mt-2 font-medium">
                Incorrect verification code. Please try again.
              </Text>
            )}
          </Animated.View>

          {/* Verify Button */}
          <TouchableOpacity
            className="bg-primary p-4 w-[80%] rounded-pill items-center shadow-md active:bg-primary-hover mb-6"
            onPress={handleVerify}
          >
            <Text className="text-surface font-bold text-base">
              Verify & Proceed
            </Text>
          </TouchableOpacity>

          {/* Resend & Back links */}
          <View className="items-center space-y-2">
            <TouchableOpacity onPress={() => console.log("Resend OTP")}>
              <Text className="text-primary font-medium text-sm">
                Didn't receive the code? <Text className="color-red-500 underline decoration-red-900 decoration-solid">Resend</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onBack} className="mt-3">
              <Text className="text-muted text-xs">Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}