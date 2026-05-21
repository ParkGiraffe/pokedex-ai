import { describe, expect, it } from "vitest";

import { moveOptions } from "../src/decision";
import { type Party, PERFECT_IVS } from "../src/types";

const garchomp: Party[number] = {
  species: "한카리아스",
  level: 50,
  nature: "고집",
  ability: "까칠한피부",
  item: "구애스카프",
  teraType: "땅",
  moves: ["지진", "역린", "스톤에지", "불꽃엄니"],
  evs: { H: 0, A: 252, B: 0, C: 0, D: 4, S: 252 },
  ivs: PERFECT_IVS,
};

describe("배틀 의사결정 옵션", () => {
  it("기술 수만큼 옵션을 만든다", () => {
    const options = moveOptions(garchomp, "라이츄");
    expect(options).toHaveLength(4);
  });

  it("지진은 전기 종족에게 데미지가 들어간다", () => {
    const options = moveOptions(garchomp, "라이츄") ?? [];
    const earthquake = options.find((option) => option.move === "지진");
    expect(earthquake?.type).toBe("땅");
    expect(earthquake?.power).toBe(100);
    expect(earthquake?.damaging).toBe(true);
    expect(earthquake?.max).toBeGreaterThan(0);
    expect(earthquake?.koChance).toBeGreaterThan(0);
  });

  it("같은 입력이면 KO 확률이 결정론적으로 같다", () => {
    const first = moveOptions(garchomp, "라이츄")?.find((option) => option.move === "지진");
    const second = moveOptions(garchomp, "라이츄")?.find((option) => option.move === "지진");
    expect(first?.koChance).toBe(second?.koChance);
  });

  it("상대 HP가 낮을수록 KO 확률이 높거나 같다", () => {
    const full = moveOptions(garchomp, "마기라스", 100)?.find((option) => option.move === "지진");
    const half = moveOptions(garchomp, "마기라스", 50)?.find((option) => option.move === "지진");
    expect((half?.koChance ?? 0)).toBeGreaterThanOrEqual(full?.koChance ?? 0);
  });

  it("모르는 종족은 옵션을 내지 않는다", () => {
    expect(moveOptions(garchomp, "없는포켓몬")).toBeUndefined();
  });
});
