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

  it("도구가 기술 칸에 섞여 있어도 사전으로 재분류한다", () => {
    const { party } = buildImportResult([
      { species: "핫삼", item: "칼춤", moves: ["불릿펀치", "더블윙", "날개쉬기", "핫삼나이트"] },
    ]);
    expect(party[0]!.item).toBe("핫삼나이트");
    expect(party[0]!.moves).toContain("칼춤");
    expect(party[0]!.moves).toContain("불릿펀치");
  });

  it("OCR 오타를 가까운 이름으로 교정한다", () => {
    const { party } = buildImportResult([{ species: "킬라플로로", moves: ["볼릿펀치"] }]);
    expect(party[0]!.species).toBe("킬라플로르");
    expect(party[0]!.moves).toContain("불릿펀치");
  });

  it("빈 기술 슬롯을 채우고 최대 6마리만 받는다", () => {
    const { party } = buildImportResult([{ species: "한카리아스", moves: ["지진", "역린"] }]);
    expect(party[0]!.moves).toEqual(["지진", "역린", "", ""]);
    expect(
      buildImportResult(Array.from({ length: 9 }, () => ({ species: "한카리아스" }))).party
    ).toHaveLength(6);
  });
});
