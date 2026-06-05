import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth';

import { fetchQuota } from '../api';

// 로그인 상태에서만 오늘의 AI 질의 잔여를 조회한다.
export const useQuota = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['quota'],
    queryFn: fetchQuota,
    enabled: Boolean(token),
  });
};
