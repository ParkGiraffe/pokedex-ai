import { createRoute, redirect } from '@tanstack/react-router';

import { rootRoute } from './__root';

export const battleVisionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/battle-vision',
  beforeLoad: () => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/battle', search: { tab: 'screenshot' } });
  },
});
