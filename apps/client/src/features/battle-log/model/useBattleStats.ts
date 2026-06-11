import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth';

import { type BattleStatsRes, fetchBattleStats } from '../api';

export const useBattleStats = (): ReturnType<typeof useQuery<BattleStatsRes>> => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['battle-logs', 'stats'],
    queryFn: fetchBattleStats,
    enabled: Boolean(token),
  });
};
