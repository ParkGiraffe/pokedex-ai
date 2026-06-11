import { createRoute } from '@tanstack/react-router';

import { MatchupPage } from '@/pages/matchup/ui/MatchupPage';

import { rootRoute } from './__root';

type Tab = 'lead' | 'matrix';

type MatchupSearch = { tab: Tab };

const VALID_TABS: ReadonlyArray<Tab> = ['lead', 'matrix'];

const validateSearch = (search: Record<string, unknown>): MatchupSearch => {
  const tab = search['tab'];
  return { tab: VALID_TABS.includes(tab as Tab) ? (tab as Tab) : 'lead' };
};

export const matchupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/matchup',
  validateSearch,
  component: MatchupPage,
});
