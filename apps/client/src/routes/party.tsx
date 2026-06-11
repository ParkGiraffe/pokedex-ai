import { createRoute } from '@tanstack/react-router';

import { PartyPage } from '@/pages/party/ui/PartyPage';

import { rootRoute } from './__root';

export const partyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/party',
  component: PartyPage,
});
