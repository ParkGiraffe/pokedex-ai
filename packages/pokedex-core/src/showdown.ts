import naturesRaw from "../data/natures.json" with { type: "json" };
import typesRaw from "../data/types.json" with { type: "json" };
import setsRaw from "../data/meta/sets-gen9.json" with { type: "json" };
import usageRaw from "../data/meta/usage-gen9.json" with { type: "json" };
import { findPokemon } from "./lookup";

// 한국어/영문/표시명 → Pokémon Showdown ID (소문자, 영숫자 외 제거).
export const toShowdownId = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const capitalize = (value: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const natureEnByKo = new Map(
  (naturesRaw as { natures: Array<{ ko: string; en: string }> }).natures.map((n) => [n.ko, capitalize(n.en)])
);
const typeEnByKo = (typesRaw as { types_ko_to_en: Record<string, string> }).types_ko_to_en;

// 성격/타입 한국어 → Showdown 영문 표기(예: 고집 → Adamant, 강철 → Steel). 미상은 그대로.
export const natureEnOf = (nature: string): string => natureEnByKo.get(nature) ?? nature;
export const typeEnOf = (type: string): string => capitalize(typeEnByKo[type] ?? type.toLowerCase());

export type SmogonSet = {
  format: string;
  name: string;
  level?: number;
  ability?: string | string[];
  item?: string | string[];
  nature?: string | string[];
  moves: Array<string | string[]>;
  evs?: Record<string, number>;
  ivs?: Record<string, number>;
  teratypes?: string | string[];
};

export type SmogonUsage = {
  display: string;
  format: string;
  usage: number;
  abilities: Array<[string, number]>;
  items: Array<[string, number]>;
  teraTypes: Array<[string, number]>;
  spreads: Array<[string, number]>;
  moves: Array<[string, number]>;
  teammates: Array<[string, number]>;
};

type SetsFile = { sets: Record<string, { display: string; sets: SmogonSet[] }> };
type UsageFile = { pokemon: Record<string, SmogonUsage> };

const setsById = (setsRaw as unknown as SetsFile).sets;
const usageById = (usageRaw as unknown as UsageFile).pokemon;

// 입력이 한국어명/도감번호면 도감으로 영문명을 찾아 id화하고, 아니면 그대로 id화한다.
const resolveId = (species: string): string => {
  const entry = findPokemon(species);
  return toShowdownId(entry ? entry.en : species);
};

export const showdownIdOf = (species: string): string => resolveId(species);

export const smogonSets = (species: string): SmogonSet[] => setsById[resolveId(species)]?.sets ?? [];

export const smogonUsage = (species: string): SmogonUsage | undefined => usageById[resolveId(species)];

export const hasMeta = (species: string): boolean => {
  const id = resolveId(species);
  return Boolean(setsById[id] ?? usageById[id]);
};
