import { createRoute } from '@tanstack/react-router';

import { LeaderboardPage } from '@/pages/leaderboard/ui/LeaderboardPage';

import { rootRoute } from './__root';

// 인기 파티 리더보드. 가드 없음 — 비로그인도 접근 가능.
export const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leaderboard',
  component: LeaderboardPage,
});
