import { createRoute } from '@tanstack/react-router';

import { DexPage } from '@/pages/dex/ui/DexPage';

import { rootRoute } from './__root';

export const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/docs',
  component: DexPage,
});
