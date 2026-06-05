import { createRouter } from '@tanstack/react-router';

import { rootRoute } from './routes/__root';
import { battleRoute } from './routes/battle';
import { calculatorRoute } from './routes/calculator';
import { docsRoute } from './routes/docs';
import { logRoute } from './routes/log';
import { matchupRoute } from './routes/matchup';
import { partyRoute } from './routes/party';
import { sharedPresetRoute } from './routes/shared-preset';
import { speedRoute } from './routes/speed';

const routeTree = rootRoute.addChildren([
  calculatorRoute,
  speedRoute,
  docsRoute,
  partyRoute,
  matchupRoute,
  battleRoute,
  logRoute,
  sharedPresetRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
