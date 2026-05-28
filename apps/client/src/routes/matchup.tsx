import { createRoute } from "@tanstack/react-router";

import { MatchupPage } from "@/pages/matchup/ui/MatchupPage";

import { rootRoute } from "./__root";

export const matchupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/matchup",
  component: MatchupPage,
});
