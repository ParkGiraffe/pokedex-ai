import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { copyPreset } from '../api';

export const useCopyPreset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => copyPreset(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      toast.success('프리셋을 복사했습니다');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '복사 실패'),
  });
};
