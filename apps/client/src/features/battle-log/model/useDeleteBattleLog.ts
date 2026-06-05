import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { deleteBattleLog } from '../api';

export const useDeleteBattleLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBattleLog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['battle-logs'] }),
    onError: (error) => toast.error(error instanceof Error ? error.message : '배틀 로그 삭제 실패'),
  });
};
