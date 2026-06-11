import { createRoute } from '@tanstack/react-router';

import { CalculatorPage } from '@/pages/calculator/ui/CalculatorPage';

import { rootRoute } from './__root';

type Tab = 'damage' | 'speed' | 'ev';

type CalculatorSearch = { tab?: Tab };

const VALID_TABS: ReadonlyArray<Tab> = ['damage', 'speed', 'ev'];

const validateSearch = (search: Record<string, unknown>): CalculatorSearch => {
  const tab = search['tab'];
  return { tab: VALID_TABS.includes(tab as Tab) ? (tab as Tab) : 'damage' };
};

export const calculatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch,
  component: CalculatorPage,
});
