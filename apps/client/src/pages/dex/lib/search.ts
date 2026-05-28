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

