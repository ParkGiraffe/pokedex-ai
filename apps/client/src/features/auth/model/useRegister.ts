import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { type AuthResult, registerUser } from '../api';
import { useAuthStore } from './store';

export const useRegister = (): ReturnType<
  typeof useMutation<AuthResult, Error, { email: string; password: string; nickname?: string }>
> => {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: registerUser,
    onSuccess: (result) => {
      setSession(result.accessToken, result.user);
      toast.success('가입했습니다');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '회원가입 실패'),
  });
};
