import { describe, expect, it } from "vitest";

import {
  championsAssumedSet,
  championsSamples,
  championsUsage,
  inChampionsRoster,
} from "../src/champions";

describe("챔피언스 데이터", () => {
  it("로스터 포함 여부를 판별한다", () => {
    expect(inChampionsRoster("한카리아스")).toBe(true);
    expect(inChampionsRoster("없는포켓몬")).toBe(false);
  });

  it("사용률 1위로 예상 세트를 만들고 노력 포인트를 0~32로 둔다", () => {
    const set = championsAssumedSet("한카리아스");
    expect(set?.moves).toContain("earthquake");
    expect(set?.evs.atk).toBeGreaterThan(0);
    expect(set?.evs.atk).toBeLessThanOrEqual(32);
  });

  it("샘플 세트에 메가 폼이 반영된다", () => {
    const samples = championsSamples("한카리아스", 50);
    expect(samples.length).toBeGreaterThan(0);
    expect(samples.some((sample) => sample.mega)).toBe(true);
  });

  it("사용률 통계를 조회한다", () => {
    expect(championsUsage("한카리아스")?.moves.length).toBeGreaterThan(0);
  });
});
