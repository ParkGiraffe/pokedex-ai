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
const abilityByEn = new Map(abilities.map((a) => [a.en, a]));
const itemByKo = new Map(items.map((i) => [i.ko, i]));
const itemByEn = new Map(items.map((i) => [i.en, i]));

// 영문 슬러그 → 정식 한국명. PokeAPI/Showdown 세트 데이터를 한국 어휘로 변환할 때 쓴다.
// 변환 실패(매핑 없음) 시 undefined — 호출 측에서 영문 음역 출력을 피하도록 처리한다.
export const moveKoByEn = (en: string): string | undefined => moveByEn.get(en)?.ko;
export const abilityKoByEn = (en: string): string | undefined => abilityByEn.get(en)?.ko;
export const itemKoByEn = (en: string): string | undefined => itemByEn.get(en)?.ko;

export const findPokemon = (key: string | number): PokedexEntry | undefined => {
  if (typeof key === "number") return pokedexByNo.get(key);
  return pokedexByKo.get(key) ?? pokedexByEn.get(key.toLowerCase());
};

export const findMove = (key: string): MoveData | undefined =>
  moveByKo.get(key) ?? moveByEn.get(key.toLowerCase());

export const findAbility = (key: string): AbilityData | undefined =>
  abilityByKo.get(key) ?? abilityByEn.get(key.toLowerCase());

export const findItem = (key: string): ItemData | undefined =>
  itemByKo.get(key) ?? itemByEn.get(key.toLowerCase());

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

// 검증된 한국 명칭 사전 (포켓몬·기술·특성·도구). AI 응답의 고유명사 검증에 쓴다.
const knownTerms = new Set<string>([
  ...pokedexByKo.keys(),
  ...moves.map((m) => m.ko),
  ...abilities.map((a) => a.ko),
  ...items.map((i) => i.ko),
]);

// 정식 한국 명칭인지 확인. "메가XX"·"메가 XX"는 종족명 부분으로, 끝의 " X"/" Y"는 떼고 검증한다.
// 사전에 없으면 음역·직역·fabricate 의심 명칭이다.
export const isKnownTerm = (name: string): boolean => {
  const trimmed = name.trim();
  if (knownTerms.has(trimmed)) {
    return true;
  }
  const base = trimmed.replace(/^메가\s*/, "").replace(/\s*[XY]$/, "");
  return knownTerms.has(base);
};

export const allMoves = (): readonly MoveData[] => moves;
export const allAbilities = (): readonly AbilityData[] => abilities;
export const allItems = (): readonly ItemData[] => items;
