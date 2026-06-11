import { createRoute, redirect } from '@tanstack/react-router';

import { rootRoute } from './__root';

export const speedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/speed',
  beforeLoad: () => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/', search: { tab: 'speed' } });
  },
});
