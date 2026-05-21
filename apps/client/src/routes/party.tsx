import { createRoute } from "@tanstack/react-router";

import { rootRoute } from "./__root";

const PartyPage = () => (
  <section>
    <h1 className="text-xl font-bold">파티빌더</h1>
    <p className="mt-2 text-sm text-neutral-400">파티 구성 (준비 중)</p>
  </section>
);

export const partyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/party",
  component: PartyPage,
});
