import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  email?: string;
  nickname?: string;
  tier: "free" | "paid";
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  clear: () => void;
};

// 토큰·사용자만 보관(localStorage). 만료 토큰이면 보호 요청이 401을 주고, 그때 clear한다.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: "pokedex-auth" }
  )
);
