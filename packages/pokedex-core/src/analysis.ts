import { pokedexByKo } from './data';
import { typeEffectiveness } from './formula/matchup';
import { actualStatBlock } from './formula/stat';
import { type Party, type StatBlock, TYPE_NAMES, type TypeName } from './types';

type ResolvedMember = {
  species: string;
  types: TypeName[];
  stats: StatBlock;
};

const resolveParty = (party: Party): ResolvedMember[] =>
  party
    .map((member) => {
      const entry = pokedexByKo.get(member.species);
      if (!entry) {
        return undefined;
      }
      return {
        species: member.species,
        types: entry.types,
        stats: actualStatBlock(entry.base, member.evs, member.ivs, member.level, member.nature),
      };
    })
    .filter((resolved): resolved is ResolvedMember => resolved !== undefined);

export type TypeCount = {
  type: TypeName;
  weak: number;
  resist: number;
  immune: number;
};

export const weaknessMatrix = (party: Party): TypeCount[] => {
  const resolved = resolveParty(party);
  return TYPE_NAMES.map((type) => {
    let weak = 0;
    let resist = 0;
    let immune = 0;
    for (const member of resolved) {
      const effectiveness = typeEffectiveness(type, member.types);
      if (effectiveness === 0) {
        immune += 1;
      } else if (effectiveness > 1) {
        weak += 1;
      } else if (effectiveness < 1) {
        resist += 1;
      }
    }
    return { type, weak, resist, immune };
  });
};

export type SpeedTierName = '빠름' | '중간' | '느림';

export type MemberSpeed = {
  species: string;
  speed: number;
  tier: SpeedTierName;
};

const tierOf = (speed: number): SpeedTierName => (speed >= 130 ? '빠름' : speed >= 90 ? '중간' : '느림');

export const speedTier = (party: Party): MemberSpeed[] =>
  resolveParty(party).map((member) => ({
    species: member.species,
    speed: member.stats.S,
    tier: tierOf(member.stats.S),
  }));

export type StatBalance = {
  physicalPower: number;
  specialPower: number;
  bulk: number;
  topSpeed: number;
};

export const statBalance = (party: Party): StatBalance => {
  const resolved = resolveParty(party);
  const sum = (pick: (stats: StatBlock) => number): number =>
    resolved.reduce((total, member) => total + pick(member.stats), 0);
  return {
    physicalPower: sum((stats) => stats.A),
    specialPower: sum((stats) => stats.C),
    bulk: sum((stats) => stats.H + stats.B + stats.D),
    topSpeed: resolved.reduce((max, member) => Math.max(max, member.stats.S), 0),
  };
};

export type Synergy = {
  sharedWeaknessPeak: number;
  stackedTypes: TypeName[];
  dispersionScore: number;
};

export const synergy = (party: Party): Synergy => {
  const matrix = weaknessMatrix(party);
  const peak = matrix.reduce((max, count) => Math.max(max, count.weak), 0);
  const stackedTypes = matrix.filter((count) => count.weak >= 3).map((count) => count.type);
  const size = resolveParty(party).length || 1;
  const dispersionScore = Math.round((1 - peak / size) * 100);
  return { sharedWeaknessPeak: peak, stackedTypes, dispersionScore };
};

export type Role = '물리에이스' | '특수에이스' | '내구형' | '고속어태커' | '밸런스';

export type RoleDistribution = Record<Role, number>;

const inferRole = (stats: StatBlock): Role => {
  const bulk = stats.H + stats.B + stats.D;
  if (bulk >= 500) {
    return '내구형';
  }
  if (stats.S >= 130) {
    return '고속어태커';
  }
  if (stats.A >= 150 && stats.A > stats.C) {
    return '물리에이스';
  }
  if (stats.C >= 150 && stats.C > stats.A) {
    return '특수에이스';
  }
  return '밸런스';
};

export const role = (party: Party): RoleDistribution => {
  const distribution: RoleDistribution = {
    물리에이스: 0,
    특수에이스: 0,
    내구형: 0,
    고속어태커: 0,
    밸런스: 0,
  };
  for (const member of resolveParty(party)) {
    distribution[inferRole(member.stats)] += 1;
  }
  return distribution;
};

export type PartyAnalysis = {
  weakness: TypeCount[];
  speed: MemberSpeed[];
  balance: StatBalance;
  synergy: Synergy;
  roles: RoleDistribution;
};

export const analyzeParty = (party: Party): PartyAnalysis => ({
  weakness: weaknessMatrix(party),
  speed: speedTier(party),
  balance: statBalance(party),
  synergy: synergy(party),
  roles: role(party),
});
