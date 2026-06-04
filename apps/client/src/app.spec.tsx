import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import "@/i18n";
import { rootRoute } from "@/routes/__root";
import { battleRoute } from "@/routes/battle";
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
      battleRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [initial] }),
  });

// 실제 앱(main.tsx)처럼 QueryClientProvider로 감싼다(헤더의 AuthMenu가 react-query 훅을 쓴다).
const renderApp = (initial: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={makeRouter(initial)} />
    </QueryClientProvider>
  );

describe("앱 라우팅", () => {
  it("계산기 경로가 렌더된다", async () => {
    renderApp("/");
    expect(await screen.findByRole("heading", { name: "계산기" })).toBeInTheDocument();
  });

  it("도감 경로가 렌더된다", async () => {
    renderApp("/docs");
    expect(await screen.findByRole("heading", { name: "도감" })).toBeInTheDocument();
  });
});
