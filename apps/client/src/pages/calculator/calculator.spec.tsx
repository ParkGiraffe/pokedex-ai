import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { computeCalc } from "./lib/calc";
import { useCalculatorStore } from "./model/store";
import { CalculatorPage } from "./ui/CalculatorPage";

const { attacker, defender } = useCalculatorStore.getState();

describe("계산기 페이지", () => {
  it("기본 매치업 결과를 렌더한다", () => {
    render(<CalculatorPage />);
    expect(screen.getByRole("heading", { name: "계산기" })).toBeInTheDocument();
    expect(screen.getByText(/상성/)).toBeInTheDocument();
  });

  it("땅 기술이 전기 종족에 2배로 들어간다", () => {
    const result = computeCalc({ ...attacker, moveType: "땅" }, { ...defender, species: "라이츄" });
    expect(result?.damage.effectiveness).toBe(2);
    expect(result?.damage.max).toBeGreaterThan(0);
  });

  it("땅 기술은 비행 복합 종족에 0배라 데미지가 없다", () => {
    const result = computeCalc({ ...attacker, moveType: "땅" }, { ...defender, species: "리자몽" });
    expect(result?.damage.effectiveness).toBe(0);
    expect(result?.damage.max).toBe(0);
  });
});
