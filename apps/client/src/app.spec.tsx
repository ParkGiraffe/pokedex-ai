import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import "@/i18n";
import { rootRoute } from "@/routes/__root";
import { calculatorRoute } from "@/routes/calculator";
import { docsRoute } from "@/routes/docs";
import { matchupRoute } from "@/routes/matchup";
import { partyRoute } from "@/routes/party";
import { speedRoute } from "@/routes/speed";

const makeRouter = (initial: string) =>
  createRouter({
    routeTree: rootRoute.addChildren([
      calculatorRoute,
      speedRoute,
      docsRoute,
      partyRoute,
      matchupRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [initial] }),
  });

describe("앱 라우팅", () => {
  it("계산기 경로가 렌더된다", async () => {
    render(<RouterProvider router={makeRouter("/")} />);
    expect(await screen.findByRole("heading", { name: "계산기" })).toBeInTheDocument();
  });

  it("도감 경로가 렌더된다", async () => {
    render(<RouterProvider router={makeRouter("/docs")} />);
    expect(await screen.findByRole("heading", { name: "도감" })).toBeInTheDocument();
  });
});
