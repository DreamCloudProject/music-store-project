import { apiClient } from "./client";

export interface User {
  id: string;
  username: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export async function register(username: string, password: string) {
  const { data } = await apiClient.post("/register", { username, password });
  return data;
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/login", {
    username,
    password,
  });
  localStorage.setItem("token", data.token);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/me");
  return data;
}

export function logout() {
  localStorage.removeItem("token");
}
