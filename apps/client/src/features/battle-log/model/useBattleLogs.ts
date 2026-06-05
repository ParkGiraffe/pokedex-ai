import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth';

import { fetchBattleLogs } from '../api';

export const useBattleLogs = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['battle-logs'],
    queryFn: fetchBattleLogs,
    enabled: Boolean(token),
  });
};
