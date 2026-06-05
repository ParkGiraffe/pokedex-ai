import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { adviseScreenshot } from '../api';

export const useBattleVision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adviseScreenshot,
    // 성공·실패 모두 쿼터를 다시 읽어 헤더 잔여 표시를 갱신한다.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['quota'] }),
    onError: (error) => toast.error(error instanceof Error ? error.message : '스크린샷 분석 실패'),
  });
};
