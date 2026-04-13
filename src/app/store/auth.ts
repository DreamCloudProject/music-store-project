import { create } from "zustand";
import type { User } from "../api/auth";
import { refresh, getMe, logout } from "../api/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setUser: (user: User | null) => void;
  clear: () => void;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clear: () => set({ user: null, isAuthenticated: false }),
  init: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      set({ isInitializing: false });
      return;
    }
    try {
      const success = await refresh();
      if (!success) {
        set({ isInitializing: false });
        return;
      }
      const user = await getMe();
      set({ user, isAuthenticated: true, isInitializing: false });
    } catch {
      await logout();
      set({ isInitializing: false });
    }
  },
}));
