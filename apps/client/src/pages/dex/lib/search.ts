import {
  formula,
  pokedex,
  type PokedexEntry,
  type TypeName,
  TYPE_NAMES,
} from "@pokedex-agent/pokedex-core";

export const ALL_TYPES = "전체";
export const ALL_GENERATIONS = 0;

export type DexFilter = {
  query: string;
  type: TypeName | typeof ALL_TYPES;
  generation: number;
};

export const filterDex = (filter: DexFilter): PokedexEntry[] => {
  const query = filter.query.trim().toLowerCase();
  return pokedex.entries.filter((entry) => {
    if (filter.type !== ALL_TYPES && !entry.types.includes(filter.type)) {
      return false;
    }
    if (filter.generation !== ALL_GENERATIONS && entry.generation !== filter.generation) {
      return false;
    }
    if (query) {
      return (
        entry.ko.includes(filter.query.trim()) ||
        entry.en.includes(query) ||
        String(entry.no) === query
      );
    }
    return true;
  });
};

export type Weakness = {
  type: TypeName;
  multiplier: number;
};

export const weaknessTable = (types: ReadonlyArray<TypeName>): Weakness[] =>
  TYPE_NAMES.map((type) => ({ type, multiplier: formula.typeEffectiveness(type, types) }));

export const baseStatTotal = (entry: PokedexEntry): number => {
  const { H, A, B, C, D, S } = entry.base;
  return H + A + B + C + D + S;
};

export const buildSpeciesMarkdown = (entry: PokedexEntry): string => {
  const weak = weaknessTable(entry.types).filter((w) => w.multiplier > 1);
  return [
    "## 작업: 종족 운용법 분석",
    "",
    `- 종족: ${entry.ko} (#${entry.no}, ${entry.types.join("/")})`,
    `- 종족값: H${entry.base.H}/A${entry.base.A}/B${entry.base.B}/C${entry.base.C}/D${entry.base.D}/S${entry.base.S} (합 ${baseStatTotal(entry)})`,
    `- 약점: ${weak.map((w) => `${w.type} ${w.multiplier}배`).join(", ") || "없음"}`,
    "",
    "## 요청",
    "- 9세대 SV 싱글에서 이 종족의 운용법, 추천 배분, 견제 라인을 한국 SV 어휘로 분석",
    "- 응답 마지막에 표준 JSON 코드블록을 반드시 포함",
  ].join("\n");
};
