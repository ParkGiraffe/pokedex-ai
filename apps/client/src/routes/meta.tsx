import { createRoute } from '@tanstack/react-router';

import { MetaPage } from '@/pages/meta/ui/MetaPage';

import { rootRoute } from './__root';

type Tab = 'usage' | 'presets';

type MetaSearch = { tab: Tab };

const VALID_TABS: ReadonlyArray<Tab> = ['usage', 'presets'];

const validateSearch = (search: Record<string, unknown>): MetaSearch => {
  const tab = search['tab'];
  return { tab: VALID_TABS.includes(tab as Tab) ? (tab as Tab) : 'usage' };
};

export const metaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/meta',
  validateSearch,
  component: MetaPage,
});
