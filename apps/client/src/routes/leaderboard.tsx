import { createRoute, redirect } from '@tanstack/react-router';

import { rootRoute } from './__root';

export const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leaderboard',
  beforeLoad: () => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/meta', search: { tab: 'presets' } });
  },
});
