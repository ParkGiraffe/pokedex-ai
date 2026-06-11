import { createRoute } from '@tanstack/react-router';

import { BattleVisionPage } from '@/pages/battle-vision/ui/BattleVisionPage';

import { rootRoute } from './__root';

export const battleVisionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/battle-vision',
  component: BattleVisionPage,
});
