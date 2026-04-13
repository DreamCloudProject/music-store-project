import { apiClient, setAccessToken } from "./client";

export interface User {
  _id: string;
  email: string;
}

export interface ApiError {
  code: string;
  message: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/users/me");
  return data;
}

export async function register(email: string, password: string) {
  const { data } = await apiClient.post("/auth/register", { email, password });
  return data;
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: User }> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  setAccessToken(data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  return { user: await getMe() };
}

export async function refresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  try {
    const { data } = await apiClient.post<AuthResponse>("/auth/refresh");
    setAccessToken(data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function logout() {
  try {
    await apiClient.get("/auth/logout");
  } finally {
    setAccessToken(null);
    localStorage.removeItem("refreshToken");
  }
}
