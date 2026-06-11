import { useQuery } from '@tanstack/react-query';

import { fetchLeaderboard, type LeaderboardEntry } from '../api';

// 인기 파티 리더보드 — 비로그인 포함 누구나 조회 가능.
export const useLeaderboard = (): ReturnType<typeof useQuery<LeaderboardEntry[]>> =>
  useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  });
