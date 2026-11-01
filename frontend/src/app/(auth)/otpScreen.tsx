import { Stack } from "expo-router";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
} from "react-native";

interface OtpScreenProps {
  email: string;
  onVerify: (otp: string) => void;
  onBack: () => void;
}

export default function OtpScreen({ email, onVerify, onBack }: OtpScreenProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(React.ElementRef<typeof RNTextInput> | null)[]>([]);

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

  const handleVerify = () => {
    const code = otp.join("");
    onVerify(code);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-background justify-center px-6"
      >
        <View className="bg-surface p-8 rounded-3xl shadow-lg border border-gray-200">
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

          {/* OTP Input Boxes */}
          <View className="flex-row justify-between mb-8">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                className="w-12 h-14 bg-background border border-gray-300 text-main text-center text-xl font-bold rounded-xl"
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            className="bg-primary py-4 rounded-pill items-center shadow-md active:bg-primary-hover mb-6"
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
                Didn't receive the code? Resend
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
