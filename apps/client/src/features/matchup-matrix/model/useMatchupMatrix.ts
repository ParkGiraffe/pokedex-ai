import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { fetchMatchupMatrix, type TeamSelectRequest, type TeamSelectResponse } from '../api';

export const useMatchupMatrix = (): UseMutationResult<TeamSelectResponse, Error, TeamSelectRequest> =>
  useMutation<TeamSelectResponse, Error, TeamSelectRequest>({
    mutationFn: fetchMatchupMatrix,
  });
