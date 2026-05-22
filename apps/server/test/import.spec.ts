import { describe, expect, it } from "vitest";

import { buildImportResult } from "../src/import";

describe("buildImportResult", () => {
  it("0~32 포인트를 EV(0~252)로 환산한다 (66포인트=508)", () => {
    const { party } = buildImportResult([
      { species: "한카리아스", points: { A: 32, S: 32, H: 2 }, moves: ["지진"] },
    ]);
    expect(party[0]!.evs.A).toBe(246);
    expect(party[0]!.evs.S).toBe(246);
    expect(party[0]!.evs.H).toBe(15);
  });

  it("미확인 종족·기술·도구를 경고로 남긴다", () => {
    const { warnings } = buildImportResult([
      { species: "없는포켓몬", moves: ["없는기술"], item: "없는도구" },
    ]);
    expect(warnings.some((warning) => warning.includes("종족 미확인"))).toBe(true);
    expect(warnings.some((warning) => warning.includes("기술 미확인"))).toBe(true);
  });

  it("빈 기술 슬롯을 채우고 최대 6마리만 받는다", () => {
    const { party } = buildImportResult([{ species: "한카리아스", moves: ["지진", "역린"] }]);
    expect(party[0]!.moves).toEqual(["지진", "역린", "", ""]);
    expect(buildImportResult(Array.from({ length: 9 }, () => ({ species: "한카리아스" }))).party).toHaveLength(6);
  });
});
