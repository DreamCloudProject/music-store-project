import axios from "axios";
import { useAuthStore } from "../store/auth";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "",
});

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? "";
    const isAuthEndpoint = url.includes("/login") || url.includes("/register");

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      useAuthStore.getState().clear();
      window.location.href = "/sign-in";
    }
    return Promise.reject(error);
  },
);
