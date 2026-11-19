import axios from "axios";
import * as SecureStorage from 'expo-secure-store';
import { authApi } from "./authApi";
import { useRouter } from "expo-router";

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_SERVER, 
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  } 
});

export class ApiError extends Error {
  status: number;
  code?: string;
  retryAfter?: number;
  constructor(status: number, message: string, code?: string, retryAfter?: number) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStorage.getItemAsync("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('client.ts: ', token);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401, and prevent infinite loop (if refresh itself returns 401, don't retry again)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Currently refreshing token, add this request to queue and wait
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStorage.getItemAsync('refreshToken');
        if (refreshToken) {
          const { data } = await authApi.refresh({ refreshToken });
          const newToken = data.accessToken;
  
          await SecureStorage.setItemAsync('accessToken', newToken);
          await SecureStorage.setItemAsync('refreshToken', data.refreshToken);
          apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
  
          processQueue(null, newToken);          // Release all waiting requests
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);     // Retry the original request (addNewNode)
        } else {
          throw new Error("There is no refresh token!");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed → clear credentials and redirect to login page
        await SecureStorage.deleteItemAsync('accessToken');
        await SecureStorage.deleteItemAsync('refreshToken');

        // is this valid??
        const router = useRouter();
        router.replace("/(auth)/authScreen");

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);