import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { deletePreset } from '../api';

export const useDeletePreset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      toast.success('프리셋을 삭제했습니다');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '프리셋 삭제 실패'),
  });
};
