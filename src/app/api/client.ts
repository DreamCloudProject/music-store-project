import axios from "axios";
import { useAuthStore } from "../store/auth";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "",
  withCredentials: true,
});

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Неверный email или пароль",
  USER_EXISTS: "Такой пользователь уже существует",
  NO_REFRESH_TOKEN: "Необходимо войти заново",
  INVALID_REFRESH_TOKEN: "Необходимо войти заново",
  USER_NOT_FOUND: "Пользователь не найден",
  INTERNAL_ERROR: "Внутренняя ошибка сервера",
};

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;
  const code = error.response?.data?.code;
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }
  return error.response?.data?.message ?? fallback;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url ?? "";

    const isAuthEndpoint =
      url.includes("/login") ||
      url.includes("/register") ||
      url.includes("/refresh");

    if (error.response?.status === 401 && isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await apiClient.post("/auth/refresh");
        setAccessToken(data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        setAccessToken(null);
        localStorage.removeItem("refreshToken");
        useAuthStore.getState().clear();
        window.location.href = "/sign-in";
      }
    }
    return Promise.reject(error);
  },
);
