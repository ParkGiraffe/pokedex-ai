import { describe, expect, it } from "vitest";

import { toAdviceMon } from "./to-advice-mon";

const member = {
  species: "한카리아스",
  level: 50,
  ability: "까칠한피부",
  item: "구애스카프",
  nature: "고집",
  teraType: "땅",
  moves: ["지진", "역린", "", ""],
  evs: { H: 0, A: 32, B: 0, C: 0, D: 1, S: 32 },
  ivs: { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 },
} as unknown as Parameters<typeof toAdviceMon>[0];

describe("toAdviceMon", () => {
  it("EV 약자를 서버 키로 환산하고 0은 제외한다", () => {
    expect(toAdviceMon(member).evs).toEqual({ atk: 252, spd: 4, spe: 252 });
  });

  it("빈 기술 슬롯을 제거한다", () => {
    expect(toAdviceMon(member).moves).toEqual(["지진", "역린"]);
  });

  it("메가 옵션과 한국어 입력을 그대로 넘긴다", () => {
    const result = toAdviceMon(member, { mega: true });
    expect(result.mega).toBe(true);
    expect(result.nature).toBe("고집");
    expect(result.item).toBe("구애스카프");
  });
});
