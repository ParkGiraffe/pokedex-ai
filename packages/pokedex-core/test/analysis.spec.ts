import { describe, expect, it } from "vitest";

import { role, speedTier, statBalance, synergy, weaknessMatrix } from "../src/analysis";
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

const partyOf = (count: number): Party => Array.from({ length: count }, () => garchomp);

describe("파티 약점 매트릭스", () => {
  it("한카리아스는 얼음에 약한 멤버로 집계된다", () => {
    const matrix = weaknessMatrix(partyOf(1));
    expect(matrix.find((entry) => entry.type === "얼음")?.weak).toBe(1);
  });

  it("드래곤 면역 타입은 약점으로 세지 않는다", () => {
    const matrix = weaknessMatrix(partyOf(1));
    expect(matrix.find((entry) => entry.type === "노말")?.weak).toBe(0);
  });
});

describe("스피드 티어", () => {
  it("252 투자 한카리아스는 빠름 티어다", () => {
    const tiers = speedTier(partyOf(1));
    expect(tiers[0]?.speed).toBe(154);
    expect(tiers[0]?.tier).toBe("빠름");
  });
});

describe("스탯 균형", () => {
  it("고집 252 한카리아스의 물리 화력은 200이다", () => {
    const balance = statBalance(partyOf(1));
    expect(balance.physicalPower).toBe(200);
    expect(balance.topSpeed).toBe(154);
  });
});

describe("시너지", () => {
  it("단일 멤버는 약점 피크 1이다", () => {
    const result = synergy(partyOf(1));
    expect(result.sharedWeaknessPeak).toBe(1);
    expect(result.stackedTypes).toHaveLength(0);
  });

  it("같은 약점 3마리가 쌓이면 누적 타입으로 잡힌다", () => {
    const result = synergy(partyOf(3));
    expect(result.sharedWeaknessPeak).toBe(3);
    expect(result.stackedTypes).toContain("얼음");
    expect(result.dispersionScore).toBe(0);
  });
});

describe("역할 분포", () => {
  it("멤버 수만큼 역할이 분류된다", () => {
    const distribution = role(partyOf(2));
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(2);
    expect(distribution.고속어태커).toBe(2);
  });
});
