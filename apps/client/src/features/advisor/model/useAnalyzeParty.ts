import type { Party } from '@pokedex-agent/pokedex-core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { requestPartyAnalysis } from '../api';

export const useAnalyzeParty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (party: Party) => requestPartyAnalysis(party),
    onSuccess: () => toast.success('파티 분석 완료'),
    onError: (error) => toast.error(error instanceof Error ? error.message : '파티 분석 실패'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['quota'] }),
  });
};
