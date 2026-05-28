import { findPokemon } from "@pokedex-agent/pokedex-core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ALL_GENERATIONS, ALL_TYPES, filterDex, weaknessTable } from "./lib/search";
import { DexPage } from "./ui/DexPage";

describe("도감 페이지", () => {
  it("기본 선택 종족 상세를 렌더한다", () => {
    render(<DexPage />);
    expect(screen.getByRole("heading", { name: "도감" })).toBeInTheDocument();
    expect(screen.getAllByText(/이상해씨/).length).toBeGreaterThan(0);
  });

  it("이름으로 검색한다", () => {
    const results = filterDex({ query: "피카츄", type: ALL_TYPES, generation: ALL_GENERATIONS });
    expect(results.some((entry) => entry.no === 25)).toBe(true);
  });

  it("타입 필터는 해당 타입만 남긴다", () => {
    const results = filterDex({ query: "", type: "불꽃", generation: ALL_GENERATIONS });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((entry) => entry.types.includes("불꽃"))).toBe(true);
  });

  it("리자몽은 바위에 4배로 약하다", () => {
    const charizard = findPokemon("리자몽");
    const table = weaknessTable(charizard?.types ?? []);
    expect(table.find((entry) => entry.type === "바위")?.multiplier).toBe(4);
  });
});
