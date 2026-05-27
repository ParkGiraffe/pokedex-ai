import { describe, expect, it } from "vitest";

import { coverage, leadBoard, leadScore, pairwise } from "../src/matchup";
import { type Party, PERFECT_IVS } from "../src/types";

const garchomp: Party[number] = {
  species: "한카리아스",
  level: 50,
  nature: "고집",
  ability: "까칠한피부",
  item: "구애스카프",
  teraType: "땅",
  moves: ["지진", "역린", "스톤에지", "불꽃엄니"],
  evs: { H: 0, A: 32, B: 0, C: 0, D: 1, S: 32 },
  ivs: PERFECT_IVS,
};

describe("개별 매치업", () => {
  it("땅 자속이 전기 종족을 압박하면 유리하다", () => {
    const score = pairwise(garchomp, "라이츄");
    expect(score?.offensivePressure).toBe(2);
    expect(score?.verdict).toBe("유리");
  });

  it("상대를 최대 투자로 가정하므로 라이츄에게 스피드를 진다", () => {
    expect(pairwise(garchomp, "라이츄")?.speedAdvantage).toBe("lose");
  });

  it("모르는 종족은 점수를 내지 않는다", () => {
    expect(pairwise(garchomp, "없는포켓몬")).toBeUndefined();
  });
});

describe("선두 점수", () => {
  it("유리한 상대가 많을수록 점수가 높다", () => {
    const score = leadScore(garchomp, ["라이츄", "라이츄"]);
    expect(score.favorable).toBe(2);
    expect(score.finalScore).toBe(100);
  });

  it("상대가 없으면 중립 50점이다", () => {
    expect(leadScore(garchomp, []).finalScore).toBe(50);
  });
});

describe("커버리지·리드보드", () => {
  it("파티가 압박 가능한 상대 수를 센다", () => {
    expect(coverage([garchomp], ["라이츄"])).toEqual({ covered: 1, total: 1 });
  });

  it("리드보드는 점수 내림차순이다", () => {
    const board = leadBoard([garchomp], ["라이츄"]);
    expect(board[0]?.myPick).toBe("한카리아스");
  });
});
