import { useMutation, useQueryClient } from '@tanstack/react-query';

import { importPartyImages } from '../api';

export const useImportParty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (images: string[]) => importPartyImages(images),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['quota'] }),
  });
};
