import type { IvBlock, NatureName, StatBlock } from "../types";
import naturesRaw from "../../data/natures.json" with { type: "json" };

type Stat = keyof StatBlock;
type NatureStat = Exclude<Stat, "H">;
type NatureModifier = { up?: NatureStat; down?: NatureStat };

type NatureData = {
  id: number;
  ko: string;
  en: string;
  up: NatureStat | null;
  down: NatureStat | null;
};

const natures = (naturesRaw as { natures: NatureData[] }).natures;

// 성격별 능력치 보정은 PokeAPI /nature/ 산출물에서 파생한다 (손코딩 금지).
export const NATURE_TABLE: Record<NatureName, NatureModifier> = Object.fromEntries(
  natures.map((n) => [n.ko, { up: n.up ?? undefined, down: n.down ?? undefined }])
) as Record<NatureName, NatureModifier>;

export type ActualStatInput = {
  stat: Stat;
  base: number;
  iv: number;
  ev: number;
  level: number;
  nature: NatureName;
};

const natureMultiplier = (stat: Stat, nature: NatureName): number => {
  if (stat === "H") return 1;
  const mod = NATURE_TABLE[nature];
  if (mod.up === stat) return 1.1;
  if (mod.down === stat) return 0.9;
  return 1;
};

export const actualStat = ({ stat, base, iv, ev, level, nature }: ActualStatInput): number => {
  // ev는 챔피언스 노력 포인트(0~32). 본가 공식의 evComponent(0~63)와 매핑하면 ev * 2다.
  const evComponent = ev * 2;
  if (stat === "H") {
    if (base === 1) return 1; // 껍질몬: HP 종족값 1은 항상 1로 고정
    return Math.floor(((2 * base + iv + evComponent) * level) / 100) + level + 10;
  }
  const before = Math.floor(((2 * base + iv + evComponent) * level) / 100) + 5;
  return Math.floor(before * natureMultiplier(stat, nature));
};

export const actualStatBlock = (
  base: StatBlock,
  ev: StatBlock,
  iv: IvBlock,
  level: number,
  nature: NatureName
): StatBlock => ({
  H: actualStat({ stat: "H", base: base.H, iv: iv.H, ev: ev.H, level, nature }),
  A: actualStat({ stat: "A", base: base.A, iv: iv.A, ev: ev.A, level, nature }),
  B: actualStat({ stat: "B", base: base.B, iv: iv.B, ev: ev.B, level, nature }),
  C: actualStat({ stat: "C", base: base.C, iv: iv.C, ev: ev.C, level, nature }),
  D: actualStat({ stat: "D", base: base.D, iv: iv.D, ev: ev.D, level, nature }),
  S: actualStat({ stat: "S", base: base.S, iv: iv.S, ev: ev.S, level, nature }),
});
