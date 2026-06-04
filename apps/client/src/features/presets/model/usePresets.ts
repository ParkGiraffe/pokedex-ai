import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth";

import { fetchPresets } from "../api";

// 로그인 상태에서만 조회한다.
export const usePresets = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["presets"],
    queryFn: fetchPresets,
    enabled: Boolean(token),
  });
};
