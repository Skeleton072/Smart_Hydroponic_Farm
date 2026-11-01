import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import axios from "axios";

interface AuthScreenProps {
  onAuthenticate: (email: string) => void;
}

function validateEmail(email: string) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function validatePassword(password: string) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S+$/;
  return passwordRegex.test(password);
}

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const router = useRouter();

  async function handleSubmit() {
    if (name.trim() == "" || !validateEmail(email)) {
      console.log("Enter valid credentials!");
      // warning modal

      return;
    }

    try {
      if (isLogin) {

      } else {
        if (!validatePassword(password)) {
          console.log("Enter valid password!");
          // warning modal

          return;
        }

        const res = await axios.post(`${process.env.EXPO_PUBLIC_SERVER}/api/auth/signup`,
          {
            user_name: name,
            email,
            password,
          },
        );

        if (res.status == 200) {
          router.push("/(auth)/otpScreen");
          return;
        }

        console.log("There's something wrong with the server.");
      }
    } catch (error: any) {
      console.log("Error: ", error.message);
      return;
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        // behavior={Platform.OS === "ios" ? "padding" : "height"}
        contentContainerStyle={{
          justifyContent: 'center'
        }}
        className="flex-1 bg-background px-6 "
      >
        <View className="bg-surface p-8 rounded-3xl shadow-lg border border-gray-200">
          {/* Header Header */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-main">
              {isLogin ? "Welcome Back" : "Create Account"}
            </Text>
            <Text className="text-muted text-sm mt-1">
              {isLogin
                ? "Sign in to access your account"
                : "Sign up to get started"}
            </Text>
          </View>

          {/* Tab Toggle */}
          <View className="flex-row bg-background p-1 rounded-pill mb-6">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-pill items-center ${isLogin ? "bg-primary" : "bg-transparent"}`}
              onPress={() => setIsLogin(true)}
            >
              <Text
                className={`font-semibold ${isLogin ? "text-surface" : "text-muted"}`}
              >
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-pill items-center ${!isLogin ? "bg-primary" : "bg-transparent"}`}
              onPress={() => setIsLogin(false)}
            >
              <Text
                className={`font-semibold ${!isLogin ? "text-surface" : "text-muted"}`}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          {!isLogin && (
            <View className="mb-4">
              <Text className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">
                Full Name
              </Text>
              <TextInput
                className="bg-background border border-gray-300 text-main px-4 py-3.5 rounded-xl text-base"
                placeholder="John Doe"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />
            </View>
          )}

          <View className="mb-4">
            <Text className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">
              Email Address
            </Text>
            <TextInput
              className="bg-background border border-gray-300 text-main px-4 py-3.5 rounded-xl text-base"
              placeholder="name@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mb-6">
            <Text className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">
              Password
            </Text>
            <TextInput
              className="bg-background border border-gray-300 text-main px-4 py-3.5 rounded-xl text-base"
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Action Button */}
          <TouchableOpacity
            className="bg-primary py-4 rounded-pill items-center shadow-md active:bg-primary-hover mb-4"
            onPress={handleSubmit}
          >
            <Text className="text-surface font-bold text-base">
              {isLogin ? "Login" : "Sign Up"}
            </Text>
          </TouchableOpacity>

          {/* Accent indicator bar */}
          <View className="h-1.5 w-12 bg-accent rounded-pill self-center mt-2" />
        </View>
      </ScrollView>
    </>
  );
}
