import { describe, expect, it } from "vitest";

import { assumedSet, counterplay, inBattle, type MyMon, pairwise, teamSelect } from "../src/decision";

const mon = (species: string): MyMon => {
  const set = assumedSet(species);
  if (!set) {
    throw new Error(`세트 없음: ${species}`);
  }
  return set;
};

describe("결정 엔진", () => {
  it("사용률 1위 예상 세트를 만든다", () => {
    expect(assumedSet("위대한엄니")?.moves.length).toBeGreaterThan(0);
    expect(assumedSet("없는포켓몬")).toBeUndefined();
  });

  it("페어와이즈: 최적타 KO와 verdict를 산출한다", () => {
    const result = pairwise(mon("한카리아스"), "라이츄");
    expect(result.myBest?.koChance).toBeGreaterThan(0);
    expect(["유리", "불리", "호각"]).toContain(result.verdict);
  });

  it("선출: 상대 팀 대비 점수가 정렬된다", () => {
    const board = teamSelect([mon("한카리아스"), mon("갸라도스")], ["라이츄", "마기라스"]);
    expect(board).toHaveLength(2);
    expect(board[0]!.score).toBeGreaterThanOrEqual(board[1]!.score);
  });

  it("인배틀: 기술 옵션과 추천을 낸다", () => {
    const advice = inBattle(mon("한카리아스"), "마기라스", [mon("갸라도스")]);
    expect(advice.moveOptions.length).toBeGreaterThan(0);
    expect(advice.recommendation).toBeTruthy();
  });

  it("파훼: 상대 세트별 카운터를 도출한다", () => {
    const entries = counterplay("위대한엄니", [mon("한카리아스")]);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]!.moves.length).toBeGreaterThan(0);
  });
});
