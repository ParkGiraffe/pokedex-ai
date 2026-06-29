import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { adviseScreenshot, type BattleVisionAdvice } from '../api';

export const useBattleVision = (): ReturnType<
  typeof useMutation<BattleVisionAdvice, Error, { image: string; note?: string }>
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adviseScreenshot,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['quota'] }),
    onError: (error) => toast.error(error instanceof Error ? error.message : '스크린샷 분석 실패'),
  });
};
