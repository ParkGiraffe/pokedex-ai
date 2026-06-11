import { createRoute } from '@tanstack/react-router';

import { MatchupMatrixPage } from '@/pages/matchup-matrix/ui/MatchupMatrixPage';

import { rootRoute } from './__root';

export const matchupMatrixRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/matrix',
  component: MatchupMatrixPage,
});
