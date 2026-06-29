import setsRaw from '../data/gen9-fallback/sets-gen9.json' with { type: 'json' };
import usageRaw from '../data/gen9-fallback/usage-gen9.json' with { type: 'json' };
import { showdownIdOf, type SmogonSet, type SmogonUsage } from './showdown';

type SetsFile = { sets: Record<string, { display: string; sets: SmogonSet[] }> };
type UsageFile = { pokemon: Record<string, SmogonUsage> };

const setsById = (setsRaw as unknown as SetsFile).sets;
const usageById = (usageRaw as unknown as UsageFile).pokemon;

export const smogonSets = (species: string): SmogonSet[] => setsById[showdownIdOf(species)]?.sets ?? [];

export const smogonUsage = (species: string): SmogonUsage | undefined => usageById[showdownIdOf(species)];

export const hasMeta = (species: string): boolean => {
  const id = showdownIdOf(species);
  return Boolean(setsById[id] ?? usageById[id]);
};
