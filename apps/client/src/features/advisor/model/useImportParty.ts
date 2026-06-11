import { useMutation, useQueryClient } from '@tanstack/react-query';

import { importPartyImages, type ImportResult } from '../api';

export const useImportParty = (): ReturnType<typeof useMutation<ImportResult, Error, string[]>> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (images: string[]) => importPartyImages(images),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['quota'] }),
  });
};
