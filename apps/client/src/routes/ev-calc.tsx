import { createRoute } from '@tanstack/react-router';

import { EvCalcPage } from '@/pages/ev-calc/ui/EvCalcPage';

import { rootRoute } from './__root';

export const evCalcRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ev-calc',
  component: EvCalcPage,
});
