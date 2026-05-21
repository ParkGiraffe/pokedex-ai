import { describe, expect, it } from "vitest";

import { serializeForClaude } from "../src/export";
import type { BattleState, Party } from "../src/types";

const sampleParty: Party = [
  {
    species: "어써러셔",
    level: 50,
    nature: "신중",
    ability: "재생력",
    item: "돌격조끼",
    teraType: "강철",
    moves: ["지진", "스톤에지", "기합구슬", "탁쳐서떨구기"],
    evs: { H: 252, A: 4, B: 0, C: 0, D: 252, S: 0 },
    ivs: { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 },
  },
];

describe("Claude paste 직렬화", () => {
  it("party-analysis 작업 헤더가 첫 줄에 들어간다", () => {
    const text = serializeForClaude("party-analysis", { party: sampleParty });
    const firstLine = text.split("\n")[0]!;
    expect(firstLine).toContain("작업");
    expect(firstLine).toContain("파티 분석");
  });

  it("출력에 JSON 코드블록이 포함된다", () => {
    const text = serializeForClaude("party-analysis", { party: sampleParty });
    expect(text).toMatch(/```json\n[\s\S]+?\n```/);
  });

  it("정적 분석 섹션을 함께 첨부한다", () => {
    const text = serializeForClaude("party-analysis", { party: sampleParty });
    expect(text).toContain("정적 분석");
    expect(text).toContain("약점 분산 점수");
    expect(text).toContain("역할 분포");
  });

  it("battle-decision 작업도 직렬화한다", () => {
    const state: BattleState = {
      my: sampleParty,
      opponent: { revealed: [], field: [] },
      myField: [],
      trickRoom: false,
      turn: 3,
    };
    const text = serializeForClaude("battle-decision", { state });
    expect(text).toContain("배틀 의사결정");
    expect(text).toContain("턴");
  });

  it("matchup-leadrec 출력에 매치업 점수를 첨부한다", () => {
    const state: BattleState = {
      my: sampleParty,
      opponent: { revealed: [{ species: "라이츄" }], field: [] },
      myField: [],
      trickRoom: false,
      turn: 1,
    };
    const text = serializeForClaude("matchup-leadrec", { state });
    expect(text).toContain("매치업 점수");
    expect(text).toContain("커버리지");
    expect(text).toContain("라이츄");
  });

  it("battle-decision에 내 액티브 기술 옵션을 첨부한다", () => {
    const active = sampleParty[0]!;
    const slot = {
      member: active,
      hpPercent: 100,
      ranks: { A: 0, B: 0, C: 0, D: 0, S: 0, accuracy: 0, evasion: 0 },
      terastalized: false,
    };
    const state: BattleState = {
      my: sampleParty,
      opponent: { revealed: [], field: [slot] },
      myField: [slot],
      trickRoom: false,
      turn: 5,
    };
    const text = serializeForClaude("battle-decision", { state });
    expect(text).toContain("기술 옵션");
    expect(text).toContain("KO");
  });
});
