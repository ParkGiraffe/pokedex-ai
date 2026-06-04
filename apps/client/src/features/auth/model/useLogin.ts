import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { loginUser } from "../api";
import { useAuthStore } from "./store";

export const useLogin = () => {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (result) => {
      setSession(result.accessToken, result.user);
      toast.success("로그인했습니다");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "로그인 실패"),
  });
};
