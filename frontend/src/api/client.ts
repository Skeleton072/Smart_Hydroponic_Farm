import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_SERVER,
  timeout: 10000, // 10s seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});