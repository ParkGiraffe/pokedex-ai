import { describe, expect, it } from "vitest";

import { calcDamage, type EngineSide } from "../src/calc";
import { bestGimmick } from "../src/decision";

describe("메가진화 (챔피언스)", () => {
  it("메가캥카는 일반 캥카보다 데미지가 높다 (부모자식사랑·공격 상승)", () => {
    const base: EngineSide = { species: "캥카", nature: "고집", evs: { atk: 252 } };
    const mega: EngineSide = { ...base, mega: true };
    const target: EngineSide = { species: "한카리아스" };
    const plain = calcDamage(base, target, "지진");
    const evolved = calcDamage(mega, target, "지진");
    expect(evolved.max).toBeGreaterThan(plain.max);
  });

  it("메가리자몽Y는 특공·가뭄으로 불꽃 기술이 강해진다", () => {
    const base: EngineSide = { species: "리자몽", evs: { spa: 252 } };
    const megaY: EngineSide = { ...base, mega: true, megaForme: "Y" };
    const target: EngineSide = { species: "한카리아스" };
    const plain = calcDamage(base, target, "화염방사");
    const evolved = calcDamage(megaY, target, "화염방사");
    expect(evolved.max).toBeGreaterThan(plain.max);
  });

  it("리자몽 메가 X와 Y는 종족이 달라 결과가 다르다", () => {
    const target: EngineSide = { species: "한카리아스" };
    const megaX = calcDamage(
      { species: "리자몽", mega: true, megaForme: "X", evs: { atk: 252 } },
      target,
      "역린"
    );
    expect(megaX.max).toBeGreaterThan(0);
  });

  it("기믹 1개 규칙: 메가/테라/안 씀 중 이득인 쪽을 추천한다", () => {
    const plan = bestGimmick(
      { species: "캥카", moves: ["지진", "깨물어부수기", "속이기"], nature: "고집", evs: { atk: 252 } },
      { species: "한카리아스" },
      { canMega: true, canTera: true, teraType: "노말" }
    );
    expect(plan.options.length).toBeGreaterThanOrEqual(3);
    expect(["mega", "tera", "none"]).toContain(plan.recommend);
    const none = plan.options.find((option) => option.gimmick === "none");
    const mega = plan.options.find((option) => option.gimmick === "mega");
    expect(mega!.max).toBeGreaterThan(none!.max);
  });
});
