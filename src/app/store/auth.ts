import { create } from "zustand";
import type { User } from "../api/auth";
import { getMe, logout } from "../api/auth";

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
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isInitializing: false });
      return;
    }
    try {
      const user = await getMe();
      set({ user, isAuthenticated: true, isInitializing: false });
    } catch {
      logout();
      set({ isInitializing: false });
    }
  },
}));
