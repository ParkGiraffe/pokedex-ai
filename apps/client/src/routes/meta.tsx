import { createRoute } from '@tanstack/react-router';

import { MetaPage } from '@/pages/meta/ui/MetaPage';

import { rootRoute } from './__root';

// 리빙 메타. 가드 없음 — 비로그인도 접근 가능.
export const metaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/meta',
  component: MetaPage,
});
