import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { unsharePreset } from '../api';

export const useUnsharePreset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unsharePreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      toast.success('공유를 취소했습니다');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '공유 취소 실패'),
  });
};
