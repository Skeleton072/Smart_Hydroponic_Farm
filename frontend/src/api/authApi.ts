import { apiClient } from "./client";

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

export const authApi = {
  login: async (payload: LoginPayload) => {
    const response = await apiClient.post("/api/auth/login", payload);
    return response.data; // Returns { user_id: string, ... }
  },

  signup: async (payload: SignupPayload) => {
    const response = await apiClient.post("/api/auth/signup", payload);
    return response.data;
  },

  verifyOtp: async (payload: verifyOtpPayload) => {
    const response = await apiClient.post("/api/auth/verifyOTP", payload);
    return { status: response.status, data: response.data }
  }
};