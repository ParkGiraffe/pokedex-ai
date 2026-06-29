import naturesRaw from '../data/natures.json' with { type: 'json' };
import typesRaw from '../data/types.json' with { type: 'json' };
import { findPokemon } from './lookup';

export const toShowdownId = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const capitalize = (value: string): string => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

const natureEnByKo = new Map(
  (naturesRaw as { natures: Array<{ ko: string; en: string }> }).natures.map((n) => [n.ko, capitalize(n.en)]),
);
const typeEnByKo = (typesRaw as { types_ko_to_en: Record<string, string> }).types_ko_to_en;

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

const resolveId = (species: string): string => {
  const entry = findPokemon(species);
  return toShowdownId(entry ? entry.en : species);
};

export const showdownIdOf = (species: string): string => resolveId(species);
