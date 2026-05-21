import type { PokedexEntry } from "./types";
import { pokedex, pokedexByEn, pokedexByKo, pokedexByNo } from "./data";

import movesRaw from "../data/moves.json" with { type: "json" };
import abilitiesRaw from "../data/abilities.json" with { type: "json" };
import itemsRaw from "../data/items.json" with { type: "json" };

type MoveData = {
  id: number;
  ko: string;
  en: string;
  type: string;
  type_en: string;
  category: "물리" | "특수" | "변화";
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
};

type AbilityData = { id: number; ko: string; en: string };
type ItemData = { id: number; ko: string; en: string; category: string };

const moves = (movesRaw as { moves: MoveData[] }).moves;
const abilities = (abilitiesRaw as { abilities: AbilityData[] }).abilities;
const items = (itemsRaw as { items: ItemData[] }).items;

const moveByKo = new Map(moves.map((m) => [m.ko, m]));
const moveByEn = new Map(moves.map((m) => [m.en, m]));
const abilityByKo = new Map(abilities.map((a) => [a.ko, a]));
const itemByKo = new Map(items.map((i) => [i.ko, i]));

export const findPokemon = (key: string | number): PokedexEntry | undefined => {
  if (typeof key === "number") return pokedexByNo.get(key);
  return pokedexByKo.get(key) ?? pokedexByEn.get(key.toLowerCase());
};

export const findMove = (key: string): MoveData | undefined =>
  moveByKo.get(key) ?? moveByEn.get(key.toLowerCase());

export const findAbility = (key: string): AbilityData | undefined => abilityByKo.get(key);

export const findItem = (key: string): ItemData | undefined => itemByKo.get(key);

const editDistance = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
};

export const fuzzyPokemon = (query: string, limit = 5): PokedexEntry[] =>
  pokedex.entries
    .map((e) => ({ entry: e, score: Math.min(editDistance(query, e.ko), editDistance(query, e.en)) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((x) => x.entry);

export const allMoves = (): readonly MoveData[] => moves;
export const allAbilities = (): readonly AbilityData[] => abilities;
export const allItems = (): readonly ItemData[] => items;
