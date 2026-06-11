import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { deleteBattleLog } from '../api';

export const useDeleteBattleLog = (): ReturnType<typeof useMutation<void, Error, string>> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBattleLog,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['battle-logs'] }),
    onError: (error) => toast.error(error instanceof Error ? error.message : '배틀 로그 삭제 실패'),
  });
};
