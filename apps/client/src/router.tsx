import { createRouter } from '@tanstack/react-router';

import { rootRoute } from './routes/__root';
import { battleRoute } from './routes/battle';
import { battleVisionRoute } from './routes/battle-vision';
import { calculatorRoute } from './routes/calculator';
import { docsRoute } from './routes/docs';
import { evCalcRoute } from './routes/ev-calc';
import { leaderboardRoute } from './routes/leaderboard';
import { logRoute } from './routes/log';
import { matchupRoute } from './routes/matchup';
import { matchupMatrixRoute } from './routes/matchup-matrix';
import { metaRoute } from './routes/meta';
import { partyRoute } from './routes/party';
import { sharedPresetRoute } from './routes/shared-preset';
import { speedRoute } from './routes/speed';

const routeTree = rootRoute.addChildren([
  calculatorRoute,
  speedRoute,
  docsRoute,
  partyRoute,
  matchupRoute,
  matchupMatrixRoute,
  battleRoute,
  battleVisionRoute,
  logRoute,
  evCalcRoute,
  leaderboardRoute,
  metaRoute,
  sharedPresetRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
