import { useQuery } from '@tanstack/react-query';

import { fetchLeaderboard, type LeaderboardEntry } from '../api';

export const useLeaderboard = (): ReturnType<typeof useQuery<LeaderboardEntry[]>> =>
  useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  });
