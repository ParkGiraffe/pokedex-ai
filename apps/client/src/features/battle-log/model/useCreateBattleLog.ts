import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { type BattleLogRes, createBattleLog, type CreateBattleLogBody } from '../api';

export const useCreateBattleLog = (): ReturnType<typeof useMutation<BattleLogRes, Error, CreateBattleLogBody>> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBattleLog,
    onSuccess: () => {
      // ['battle-logs'] 프리픽스로 목록과 통계(['battle-logs','stats'])를 함께 갱신한다.
      void queryClient.invalidateQueries({ queryKey: ['battle-logs'] });
      toast.success('배틀 로그를 기록했습니다');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '배틀 로그 저장 실패'),
  });
};
