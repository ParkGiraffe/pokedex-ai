import type { BattleState } from '@pokedex-agent/pokedex-core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { requestBattleAdvice } from '../api';

export const useBattleAdvice = (): ReturnType<
  typeof useMutation<Awaited<ReturnType<typeof requestBattleAdvice>>, Error, BattleState>
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (state: BattleState) => requestBattleAdvice(state),
    onSuccess: () => toast.success('배틀 추천 완료'),
    onError: (error) => toast.error(error instanceof Error ? error.message : '배틀 추천 실패'),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['quota'] }),
  });
};
