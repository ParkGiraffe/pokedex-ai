import { createRoute } from "@tanstack/react-router";

import { SpeedPage } from "@/pages/speed/ui/SpeedPage";

import { rootRoute } from "./__root";

export const speedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/speed",
  component: SpeedPage,
});
