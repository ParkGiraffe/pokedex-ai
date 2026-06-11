import { useMutation } from '@tanstack/react-query';

import { fetchMatchupMatrix, type TeamSelectRequest, type TeamSelectResponse } from '../api';

export const useMatchupMatrix = () =>
  useMutation<TeamSelectResponse, Error, TeamSelectRequest>({
    mutationFn: fetchMatchupMatrix,
  });
