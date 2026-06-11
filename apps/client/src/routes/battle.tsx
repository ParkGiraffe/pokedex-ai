import { createRoute } from '@tanstack/react-router';

import { BattlePage } from '@/pages/battle/ui/BattlePage';

import { rootRoute } from './__root';

type Tab = 'manual' | 'screenshot';

type BattleSearch = { tab: Tab };

const VALID_TABS: ReadonlyArray<Tab> = ['manual', 'screenshot'];

const validateSearch = (search: Record<string, unknown>): BattleSearch => {
  const tab = search['tab'];
  return { tab: VALID_TABS.includes(tab as Tab) ? (tab as Tab) : 'manual' };
};

export const battleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/battle',
  validateSearch,
  component: BattlePage,
});
