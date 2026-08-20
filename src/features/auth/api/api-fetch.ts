import { validateToken } from "../api/auth-api";
import { useAuthStore } from "../model/auth-store";

const AUTH_URL_MARKERS = [
  "/api/v1/auth/token",
  "/api/v1/auth/validate-token",
  "/api/v1/auth/verify",
  "/api/v1/logout",
] as const;

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function isAuthRequest(url: string): boolean {
  return AUTH_URL_MARKERS.some((marker) => url.includes(marker));
}

function withAuthHeaders(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers);
  const session = useAuthStore.getState().session;
  if (session?.token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }
  return { ...init, headers };
}

async function reauthorize(): Promise<boolean> {
  const session = useAuthStore.getState().session;
  if (!session) return false;

  const ok = await validateToken(session);
  if (ok) return true;

  useAuthStore.getState().clearSession();
  return false;
}

/** Fetch с Bearer-токеном; при 401 — validateToken и один повтор (не для auth URL). */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = requestUrl(input);
  if (isAuthRequest(url)) {
    return fetch(input, init);
  }

  const response = await fetch(input, withAuthHeaders(init));
  if (response.status !== 401) return response;

  const renewed = await reauthorize();
  if (!renewed) return response;

  return fetch(input, withAuthHeaders(init));
}
