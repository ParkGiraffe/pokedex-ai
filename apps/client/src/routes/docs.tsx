import { createRoute } from "@tanstack/react-router";

import { rootRoute } from "./__root";

const DexPage = () => (
  <section>
    <h1 className="text-xl font-bold">도감</h1>
    <p className="mt-2 text-sm text-neutral-400">종족 도감 (준비 중)</p>
  </section>
);

export const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: DexPage,
});
