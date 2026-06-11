import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth';

import { type BattleLogRes, fetchBattleLogs } from '../api';

export const useBattleLogs = (): ReturnType<typeof useQuery<BattleLogRes[]>> => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['battle-logs'],
    queryFn: fetchBattleLogs,
    enabled: Boolean(token),
  });
};
