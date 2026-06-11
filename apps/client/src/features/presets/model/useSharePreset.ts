import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { sharePreset } from '../api';

// 공유 토큰을 발급한다. 성공 시 프리셋 목록을 갱신해 공유 상태를 반영한다.
export const useSharePreset = (): ReturnType<typeof useMutation<{ shareToken: string }, Error, string>> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sharePreset,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['presets'] }),
    onError: (error) => toast.error(error instanceof Error ? error.message : '공유 실패'),
  });
};
