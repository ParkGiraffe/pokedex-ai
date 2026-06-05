import setsRaw from '../data/gen9-fallback/sets-gen9.json' with { type: 'json' };
import usageRaw from '../data/gen9-fallback/usage-gen9.json' with { type: 'json' };
import { showdownIdOf, type SmogonSet, type SmogonUsage } from './showdown';

// gen9 Smogon 폴백 데이터(약 2MB)는 브라우저가 쓰지 않고 서버측 battle-engine만 소비한다.
// 메인 배럴(index)에 넣지 않고 node 전용 ./fallback 서브패스로만 노출해 클라이언트 번들에서 제외한다.
// 챔피언스 샘플이 없는 종(로스터의 약 38%)에 대해서만 최후의 가정 셋·사용률로 쓰인다.

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
