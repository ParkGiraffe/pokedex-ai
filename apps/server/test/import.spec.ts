import { describe, expect, it } from "vitest";

import { buildImportResult, mergeMembers } from "../src/import/import.service";

describe("buildImportResult", () => {
  it("노력 포인트(0~32)를 환산 없이 그대로 보존한다", () => {
    const { party } = buildImportResult([
      { species: "한카리아스", points: { A: 32, S: 32, H: 2 }, moves: ["지진"] },
    ]);
    expect(party[0]!.evs.A).toBe(32);
    expect(party[0]!.evs.S).toBe(32);
    expect(party[0]!.evs.H).toBe(2);
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

  it("두 화면(기술 + EV)을 종족 기준으로 병합한다", () => {
    const merged = mergeMembers([
      [{ species: "한카리아스", ability: "까칠한피부", item: "기합의띠", moves: ["지진", "역린"] }],
      [{ species: "킬라플로로", points: { A: 32, S: 32, H: 2 } }],
    ]);
    // 능력 화면 기술 + 스테이터스 화면 EV가 한 종족으로 합쳐지고, 종족 오타는 정규화로 매칭
    const garchomp = mergeMembers([
      [{ species: "한카리아스", moves: ["지진"] }],
      [{ species: "한카리아스", points: { A: 32 } }],
    ]);
    expect(garchomp).toHaveLength(1);
    expect(garchomp[0]!.moves).toEqual(["지진"]);
    expect(garchomp[0]!.points?.A).toBe(32);
    expect(merged).toHaveLength(2);
  });

  it("빈 기술 슬롯을 채우고 최대 6마리만 받는다", () => {
    const { party } = buildImportResult([{ species: "한카리아스", moves: ["지진", "역린"] }]);
    expect(party[0]!.moves).toEqual(["지진", "역린", "", ""]);
    expect(
      buildImportResult(Array.from({ length: 9 }, () => ({ species: "한카리아스" }))).party
    ).toHaveLength(6);
  });
});
