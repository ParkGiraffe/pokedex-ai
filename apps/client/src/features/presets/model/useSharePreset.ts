import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { sharePreset } from '../api';

export const useSharePreset = (): ReturnType<typeof useMutation<{ shareToken: string }, Error, string>> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sharePreset,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['presets'] }),
    onError: (error) => toast.error(error instanceof Error ? error.message : '공유 실패'),
  });
};
