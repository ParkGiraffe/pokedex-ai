import { createRouter } from "@tanstack/react-router";

import { rootRoute } from "./routes/__root";
import { calculatorRoute } from "./routes/calculator";
import { docsRoute } from "./routes/docs";
import { partyRoute } from "./routes/party";
import { speedRoute } from "./routes/speed";

const routeTree = rootRoute.addChildren([calculatorRoute, speedRoute, docsRoute, partyRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
