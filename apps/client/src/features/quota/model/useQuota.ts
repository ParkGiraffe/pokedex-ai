import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth';

import { fetchQuota, type QuotaStatus } from '../api';

export const useQuota = (): ReturnType<typeof useQuery<QuotaStatus>> => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['quota'],
    queryFn: fetchQuota,
    enabled: Boolean(token),
  });
};
