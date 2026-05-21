import { createRoute } from "@tanstack/react-router";

import { rootRoute } from "./__root";

const SpeedPage = () => (
  <section>
    <h1 className="text-xl font-bold">스피드</h1>
    <p className="mt-2 text-sm text-neutral-400">스피드 비교 (준비 중)</p>
  </section>
);

export const speedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/speed",
  component: SpeedPage,
});
