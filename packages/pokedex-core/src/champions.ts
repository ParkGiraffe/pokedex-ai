import rosterRaw from "../data/champions/roster.json" with { type: "json" };
import samplesRaw from "../data/champions/samples-singles.json" with { type: "json" };
import usageRaw from "../data/champions/usage-singles.json" with { type: "json" };
import { findPokemon } from "./lookup";

const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
type StatKey = (typeof STAT_KEYS)[number];
type StatPoints = Partial<Record<StatKey, number>>;
export type EvSpread = Partial<Record<StatKey, number>>;

type UsageEntry = { name: string; usage: number };
type UsageForm = {
  nameKo: string;
  megaForm: string;
  regionForm: string;
  pickRank: number | null;
  abilities: UsageEntry[];
  moves: UsageEntry[];
  items: UsageEntry[];
  natures: UsageEntry[];
  spreads: Array<{ sps: StatPoints; usage: number }>;
  teammates: UsageEntry[];
};
type Sample = {
  nameKo: string;
  nameEn: string;
  nature: string | null;
  ability: string | null;
  megaForm: string;
  item: string | null;
  level: number | null;
  evs: StatPoints;
  moves: string[];
};

const usageByNo = (usageRaw as unknown as { pokemon: Record<string, UsageForm[]> }).pokemon;
const samplesByNo = (samplesRaw as unknown as { byPokemon: Record<string, Sample[]> }).byPokemon;
const rosterList = (rosterRaw as unknown as {
  pokemon: Array<{ id: number; megaForm: string; regionForm: string }>;
}).pokemon;

// pkmnchamps의 EV(sps)는 0~32 압축 스케일이다(32 = 252EV). @smogon/calc용 0~252로 환산.
const toEvs = (sps?: StatPoints): EvSpread => {
  const evs: EvSpread = {};
  for (const key of STAT_KEYS) {
    const point = sps?.[key];
    if (point) {
      evs[key] = Math.min(252, Math.round((point * 252) / 32));
    }
  }
  return evs;
};

// 해당 종족의 샘플에서 "이 도구를 들고 메가가 된 폼"을 찾는다(종족-로컬이라 잡샘플 오염을 피함).
const megaFormOfItem = (no: number, item?: string): string | undefined => {
  if (!item) {
    return undefined;
  }
  const sample = samplesByNo[no]?.find((entry) => entry.item === item && Boolean(entry.megaForm));
  return sample?.megaForm;
};

const megaFormeOf = (megaForm: string): "X" | "Y" | undefined =>
  megaForm.endsWith("-mega-x") ? "X" : megaForm.endsWith("-mega-y") ? "Y" : undefined;

const noOf = (species: string): number | undefined => findPokemon(species)?.no;

export type ChampionsSet = {
  species: string;
  level: number;
  ability?: string;
  item?: string;
  nature?: string;
  evs: EvSpread;
  moves: string[];
  mega?: boolean;
  megaForme?: "X" | "Y";
};

export const inChampionsRoster = (species: string): boolean => {
  const no = noOf(species);
  return no !== undefined && rosterList.some((entry) => entry.id === no);
};

export const championsUsage = (species: string): UsageForm | undefined => {
  const no = noOf(species);
  return no === undefined ? undefined : usageByNo[no]?.[0];
};

// 사용률 1위 값들로 "예상 세트"를 조립한다(특성·도구·성격·스프레드·기술 top).
export const championsAssumedSet = (species: string): ChampionsSet | undefined => {
  const no = noOf(species);
  const form = championsUsage(species);
  if (no === undefined || !form) {
    return undefined;
  }
  const topItem = form.items?.[0]?.name;
  const megaForm = megaFormOfItem(no, topItem);
  return {
    species,
    level: 50,
    ability: form.abilities?.[0]?.name,
    item: topItem,
    nature: form.natures?.[0]?.name,
    evs: toEvs(form.spreads?.[0]?.sps),
    moves: (form.moves ?? []).slice(0, 4).map((move) => move.name),
    mega: megaForm ? true : undefined,
    megaForme: megaForm ? megaFormeOf(megaForm) : undefined,
  };
};

// 종족별 공개 샘플 세트(EV 환산·메가 폼 반영).
export const championsSamples = (species: string, limit = 6): ChampionsSet[] => {
  const no = noOf(species);
  if (no === undefined) {
    return [];
  }
  return (samplesByNo[no] ?? [])
    .filter((sample) => Array.isArray(sample.moves) && sample.moves.some((move) => Boolean(move)))
    .slice(0, limit)
    .map((sample) => ({
      species,
      level: sample.level ?? 50,
      ability: sample.ability ?? undefined,
      item: sample.item ?? undefined,
      nature: sample.nature ?? undefined,
      evs: toEvs(sample.evs),
      moves: (sample.moves ?? []).filter((move) => Boolean(move)),
      mega: sample.megaForm ? true : undefined,
      megaForme: sample.megaForm ? megaFormeOf(sample.megaForm) : undefined,
    }));
};
