import { describe, expect, it } from "vitest";

import { calculateDamage, type DamageInput } from "../src/formula/damage";

// 노말 기술 vs 불꽃 (상성 1배)로 자속·상성을 분리해 검증한다.
const base: DamageInput = {
  level: 50,
  attack: 130,
  defense: 100,
  basePower: 80,
  category: "물리",
  attackerTypes: ["격투"],
  defenderTypes: ["불꽃"],
  moveType: "노말",
  attackerTerastalized: false,
};

describe("SV 데미지 공식", () => {
  it("기본 물리 공격이 16롤 데미지 범위를 반환한다", () => {
    const result = calculateDamage(base);
    expect(result.rolls).toHaveLength(16);
    expect(result.effectiveness).toBe(1);
    expect(result.min).toBe(39);
    expect(result.max).toBe(47);
  });

  it("자속 보정이 1.5배로 적용된다", () => {
    const stab = calculateDamage({ ...base, attackerTypes: ["노말"] });
    const noStab = calculateDamage(base);
    expect(noStab.max).toBe(47);
    expect(stab.max).toBe(70); // pokeRound(47 * 1.5)
  });

  it("타입 상성 2배가 적용된다", () => {
    // 격투 공격자가 물 기술 사용 → 비자속, 물 vs 불꽃 2배만 적용
    const result = calculateDamage({ ...base, moveType: "물" });
    expect(result.effectiveness).toBe(2);
    expect(result.max).toBe(94); // 47 * 2
  });

  it("타입 상성 0이면 데미지가 0이다", () => {
    const result = calculateDamage({
      ...base,
      attackerTypes: ["전기"],
      moveType: "전기",
      defenderTypes: ["땅"],
    });
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
    expect(result.effectiveness).toBe(0);
  });

  it("테라 자속과 원본 자속이 겹치면 2.0배가 된다", () => {
    const teraSame = calculateDamage({
      ...base,
      attackerTypes: ["노말"],
      attackerTeraType: "노말",
      attackerTerastalized: true,
    });
    const plainStab = calculateDamage({ ...base, attackerTypes: ["노말"] });
    expect(teraSame.max).toBe(94); // pokeRound(47 * 2.0)
    expect(teraSame.max).toBeGreaterThan(plainStab.max);
  });

  it("스텔라 테라는 자속 기술을 2.0배, 비자속 기술을 1.2배로 보정한다", () => {
    const stellarStab = calculateDamage({
      ...base,
      attackerTypes: ["노말"],
      attackerTeraType: "스텔라",
      attackerTerastalized: true,
    });
    const teraSame = calculateDamage({
      ...base,
      attackerTypes: ["노말"],
      attackerTeraType: "노말",
      attackerTerastalized: true,
    });
    const stellarNonStab = calculateDamage({
      ...base,
      attackerTeraType: "스텔라",
      attackerTerastalized: true,
    });
    const plainNonStab = calculateDamage(base);
    expect(stellarStab.max).toBe(teraSame.max); // 둘 다 2.0
    expect(stellarNonStab.max).toBeGreaterThan(plainNonStab.max); // 1.2 > 1.0
  });

  it("화상은 물리 공격의 실수치를 절반으로 깎는다", () => {
    const normal = calculateDamage({ ...base, attackerTypes: ["노말"] });
    const burned = calculateDamage({ ...base, attackerTypes: ["노말"], burned: true });
    expect(burned.max).toBeLessThan(normal.max);
  });
});
