import { createRoute } from '@tanstack/react-router';

import { LogPage } from '@/pages/log/ui/LogPage';

import { rootRoute } from './__root';

export const logRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/log',
  component: LogPage,
});
