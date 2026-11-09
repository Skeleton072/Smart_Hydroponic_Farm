import { apiClient } from "./client";
import * as SecureStore from "expo-secure-store";

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload {
  user_name: string;
  email: string;
  password: string;
}

interface verifyOtpPayload {
  email: string;
  otp: string;
}

interface resendOtpPayload {
  email: string;
}

interface refreshPayload {
  refreshToken: string;
}

export const authApi = {
  login: async (payload: LoginPayload) => {
    const response = await apiClient.post("/api/auth/login", payload);
    
    // should we hash??
    await SecureStore.setItemAsync("accessToken", response.data.accessToken);
    await SecureStore.setItemAsync("refreshToken", response.data.refreshToken);

    return response.status;
  },

  signup: async (payload: SignupPayload) => {
    const response = await apiClient.post("/api/auth/signup", payload);
    return response.status;
  },

  verifyOtp: async (payload: verifyOtpPayload) => {
    const response = await apiClient.post("/api/auth/verifyOTP", payload);

    // should we hash??
    await SecureStore.setItemAsync("accessToken", response.data.accessToken);
    await SecureStore.setItemAsync("refreshToken", response.data.refreshToken);

    return response;
  },

  resendOtp: async (payload: resendOtpPayload) => {
    const response = await apiClient.post("/api/auth/resendOTP", payload);

    return response;
  },

  refresh: async (payload: refreshPayload) => {
    const response = await apiClient.post("/api/auth/refresh", payload);

    // should we hash??
    await SecureStore.setItemAsync("accessToken", response.data.accessToken);
    await SecureStore.setItemAsync("refreshToken", response.data.refreshToken);

    console.log(response);
    return response.status;
  },
};