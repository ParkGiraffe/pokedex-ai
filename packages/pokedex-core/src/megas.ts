import championsItemsRaw from '../data/champions/items.json' with { type: 'json' };
import megasRaw from '../data/champions/megas.json' with { type: 'json' };
import type { BaseStatBlock, TypeName } from './types';

export type MegaPriority = 'obligatory' | 'flexible' | 'fringe' | 'unknown';

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
  megaForme: 'X' | 'Y' | null;
  megaPriority?: MegaPriority;
};

export type ChampionsItem = { slug: string; ko: string; isMega: boolean; megaForme?: 'X' | 'Y' };

const megas = (megasRaw as { megas: MegaForm[] }).megas;
export const championsItems = (championsItemsRaw as { items: ChampionsItem[] }).items;

const byBaseKo = new Map<string, MegaForm[]>();
const byStone = new Map<string, MegaForm>();
for (const mega of megas) {
  const list = byBaseKo.get(mega.baseKo) ?? [];
  list.push(mega);
  byBaseKo.set(mega.baseKo, list);
  byStone.set(mega.stone, mega);
}

const stoneByItemKo = new Map<string, string>();
const megaByItemKo = new Map<string, MegaForm>();
for (const item of championsItems) {
  if (!item.isMega) {
    continue;
  }
  stoneByItemKo.set(item.ko, item.slug);
  const baseGuess = item.ko.endsWith('나이트') ? item.ko.slice(0, -3) : null;
  if (!baseGuess) {
    continue;
  }
  const candidates = byBaseKo.get(baseGuess) ?? [];
  if (candidates.length === 1) {
    megaByItemKo.set(item.ko, candidates[0]!);
  } else if (item.megaForme) {
    const matched = candidates.find((c) => c.megaForme === item.megaForme);
    if (matched) {
      megaByItemKo.set(item.ko, matched);
    }
  }
}

export const findMegasBySpecies = (species: string): MegaForm[] => byBaseKo.get(species) ?? [];

export const speciesDisplayName = (species: string, megaForm?: string): string => {
  if (!megaForm) {
    return species;
  }
  return byBaseKo.get(species)?.find((mega) => mega.form === megaForm)?.ko ?? species;
};

export const findMegaByStone = (stone: string): MegaForm | undefined => byStone.get(stone);

export const findMegaByItem = (itemKo: string): MegaForm | undefined => {
  const stone = stoneByItemKo.get(itemKo);
  if (stone) {
    const direct = byStone.get(stone);
    if (direct) {
      return direct;
    }
  }
  return megaByItemKo.get(itemKo);
};

export const allMegas = (): readonly MegaForm[] => megas;
