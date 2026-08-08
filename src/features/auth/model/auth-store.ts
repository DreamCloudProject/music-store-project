import { create } from "zustand";
import type { AuthSession } from "../model/types";

const STORAGE_KEY = "mastermindcms-auth-session";

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

interface AuthState {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>(() => ({
  session: loadSession(),

  setSession: (session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    useAuthStore.setState({ session });
  },

  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    useAuthStore.setState({ session: null });
  },
}));

export const selectSession = (s: AuthState) => s.session;
export const selectIsAuthenticated = (s: AuthState) => s.session !== null;
