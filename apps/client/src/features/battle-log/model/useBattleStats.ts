import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth';

import { fetchBattleStats } from '../api';

export const useBattleStats = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['battle-logs', 'stats'],
    queryFn: fetchBattleStats,
    enabled: Boolean(token),
  });
};
