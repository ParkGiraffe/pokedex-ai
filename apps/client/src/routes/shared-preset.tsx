import { createRoute } from '@tanstack/react-router';

import { SharedPresetPage } from '@/pages/shared-preset/ui/SharedPresetPage';

import { rootRoute } from './__root';

// 공개 읽기전용 공유 뷰. 가드 없음 — 비로그인도 접근 가능(서버 /shared-presets도 가드 없음).
export const sharedPresetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shared/$token',
  component: () => {
    const { token } = sharedPresetRoute.useParams();
    return <SharedPresetPage token={token} />;
  },
});
