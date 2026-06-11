import { createRoute, redirect } from '@tanstack/react-router';

import { rootRoute } from './__root';

export const matchupMatrixRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/matrix',
  beforeLoad: () => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/matchup', search: { tab: 'matrix' } });
  },
});
