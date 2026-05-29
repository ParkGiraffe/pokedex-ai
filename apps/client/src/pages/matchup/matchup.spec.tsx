import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MatchupPage } from "./ui/MatchupPage";

describe("매치업 페이지", () => {
  it("기본 파티와 상대로 매트릭스를 렌더한다", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MatchupPage />
      </QueryClientProvider>
    );
    expect(screen.getByRole("heading", { name: "매치업" })).toBeInTheDocument();
    expect(screen.getByText(/매치업 매트릭스/)).toBeInTheDocument();
    expect(screen.getByText(/선두 추천 점수/)).toBeInTheDocument();
  });
});
