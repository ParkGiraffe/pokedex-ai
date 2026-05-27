import megasRaw from "../data/champions/megas.json" with { type: "json" };
import championsItemsRaw from "../data/champions/items.json" with { type: "json" };
import type { BaseStatBlock, TypeName } from "./types";

export type MegaForm = {
  stone: string;
  form: string;
  baseNo: number;
  baseKo: string;
  ko: string;
  en: string;
  types: TypeName[];
  base: BaseStatBlock;
  ability: string;
  megaForme: "X" | "Y" | null;
};

type ChampionsItem = { slug: string; ko: string; isMega: boolean; megaForme?: "X" | "Y" };

const megas = (megasRaw as { megas: MegaForm[] }).megas;
const championsItems = (championsItemsRaw as { items: ChampionsItem[] }).items;

const byBaseKo = new Map<string, MegaForm[]>();
const byStone = new Map<string, MegaForm>();
for (const mega of megas) {
  const list = byBaseKo.get(mega.baseKo) ?? [];
  list.push(mega);
  byBaseKo.set(mega.baseKo, list);
  byStone.set(mega.stone, mega);
}

const stoneByItemKo = new Map<string, string>();
for (const item of championsItems) {
  if (item.isMega) {
    stoneByItemKo.set(item.ko, item.slug);
  }
}

// 종족 한국어명으로 가능한 메가 폼 목록 (리자몽은 X/Y 두 개, 그 외는 보통 1개).
export const findMegasBySpecies = (species: string): MegaForm[] => byBaseKo.get(species) ?? [];

// 메가스톤 슬러그로 단일 메가 폼 결정.
export const findMegaByStone = (stone: string): MegaForm | undefined => byStone.get(stone);

// 도구 한국어명으로 단일 메가 폼 결정 (예: "메가핫삼나이트" → 메가핫삼).
export const findMegaByItem = (itemKo: string): MegaForm | undefined => {
  const stone = stoneByItemKo.get(itemKo);
  return stone ? byStone.get(stone) : undefined;
};

export const allMegas = (): readonly MegaForm[] => megas;
