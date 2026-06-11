import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { type AuthResult, loginUser } from '../api';
import { useAuthStore } from './store';

export const useLogin = (): ReturnType<typeof useMutation<AuthResult, Error, { email: string; password: string }>> => {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (result) => {
      setSession(result.accessToken, result.user);
      toast.success('로그인했습니다');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '로그인 실패'),
  });
};
