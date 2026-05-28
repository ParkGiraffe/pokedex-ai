import { createRoute } from "@tanstack/react-router";

import { BattlePage } from "@/pages/battle/ui/BattlePage";

import { rootRoute } from "./__root";

export const battleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/battle",
  component: BattlePage,
});
