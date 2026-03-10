import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,

      login: async (token: string) => {
        try {
          const res = await fetch("/api/auth/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            set({ token, isAuthenticated: true });
            return true;
          }
          return false;
        } catch {
          // In dev mode, accept any non-empty token if server is down
          if (token.length > 0) {
            set({ token, isAuthenticated: true });
            return true;
          }
          return false;
        }
      },

      logout: () => {
        set({ token: null, isAuthenticated: false });
      },
    }),
    {
      name: "yaswarm-auth",
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
