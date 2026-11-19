import axios, { AxiosError } from "axios";
import { ApiError } from "./client";

export const authClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_SERVER,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  }
});

export interface AuthTokens { 
  accessToken: string; 
  refreshToken: string; 
}

function normalize(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<{ message?: string; code?: string; retryAfter?: number }>;
    if (e.code === "ECONNABORTED" || !e.response) {
      return new ApiError(0, "Network error. Check your connection and try again.");
    }

    const d = e.response.data;
    return new ApiError(e.response.status, d?.message ?? "Request failed.", d?.code, d?.retryAfter);
  }

  return new ApiError(0, "Something went wrong. Please try again.");
}

async function request<T>(fn: () => Promise<{ status: number; data: T }>): Promise<{ status: number; data: T }> {
  try { return await fn(); }
  catch (e) { throw normalize(e); }
}

export const authApi = {
  login: (body: { email: string; password: string }) =>
    request(() => authClient.post<AuthTokens>("/api/auth/login", body)),

  signup: (body: { user_name: string; email: string; password: string }) =>
    request(() => authClient.post<{ message: string }>("/api/auth/signup", body)),

  verifyOtp: (body: { email: string; otp: string }) =>
    request(() => authClient.post<AuthTokens>("/api/auth/verifyOTP", body)),

  resendOtp: (body: { email: string }) =>
    request(() => authClient.post<{ message: string }>("/api/auth/resendOTP", body)),

  refresh: (body: { refreshToken: string }) =>
    request(() => authClient.post<AuthTokens>("/api/auth/refresh", body)),

  logout: (body: { refreshToken: string }) =>
    request(() => authClient.post<void>("/auth/logout", body)),
};