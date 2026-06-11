import { createRoute, redirect } from '@tanstack/react-router';

import { rootRoute } from './__root';

export const evCalcRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ev-calc',
  beforeLoad: () => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/', search: { tab: 'ev' } });
  },
});
