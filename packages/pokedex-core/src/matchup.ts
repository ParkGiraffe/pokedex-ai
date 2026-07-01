import { pokedexByKo } from './data';
import { actualStat } from './formula/stat';
import { typeEffectiveness } from './formula/type-effectiveness';
import { findMove } from './lookup';
import type { MegaForm } from './megas';
import type { Party, PartyMember, TypeName } from './types';

export type SpeedVerdict = 'win' | 'lose' | 'tie';
export type MatchupVerdict = '유리' | '불리' | '호각';

export type PairwiseScore = {
  myPick: string;
  opponent: string;
  speedAdvantage: SpeedVerdict;
  offensivePressure: number;
  defensiveRisk: number;
  verdict: MatchupVerdict;
};

const FALLBACK_STAB_POWER = 100;

const stabFallbackScore = (attackerTypes: ReadonlyArray<TypeName>, defenderTypes: ReadonlyArray<TypeName>): number => {
  let best = 0;
  for (const type of attackerTypes) {
    const eff = typeEffectiveness(type, defenderTypes);
    const score = (FALLBACK_STAB_POWER * 1.5 * eff) / 100;
    if (score > best) {
      best = score;
    }
  }
  return best;
};

const offensiveScoreByMoves = (
  member: PartyMember,
  attackerTypes: ReadonlyArray<TypeName>,
  defenderTypes: ReadonlyArray<TypeName>,
): number => {
  let best = 0;
  for (const moveName of member.moves) {
    const move = findMove(moveName);
    if (!move || move.category === '변화' || move.power === null || move.power <= 0) {
      continue;
    }
    const moveType = move.type as TypeName;
    const stab = attackerTypes.includes(moveType) ? 1.5 : 1;
    const eff = typeEffectiveness(moveType, defenderTypes);
    const score = (move.power * stab * eff) / 100;
    if (score > best) {
      best = score;
    }
  }
  return best > 0 ? best : stabFallbackScore(attackerTypes, defenderTypes);
};

const defensiveRiskByStab = stabFallbackScore;

const myActualSpeed = (member: PartyMember, baseSpeed: number): number =>
  actualStat({
    stat: 'S',
    base: baseSpeed,
    iv: member.ivs.S,
    ev: member.evs.S,
    level: member.level,
    nature: member.nature,
  });

const opponentMaxSpeed = (baseSpeed: number, level: number): number =>
  actualStat({ stat: 'S', base: baseSpeed, iv: 31, ev: 32, level, nature: '겁쟁이' });

const applyMega = <T extends { base: { S: number }; types: ReadonlyArray<TypeName> }>(
  entry: T,
  mega: MegaForm | undefined,
): T => (mega ? { ...entry, base: { ...entry.base, ...mega.base }, types: mega.types } : entry);

export type MatchupContext = {
  myMegaByPick?: ReadonlyMap<string, MegaForm>;
  opponentMegaBySpecies?: ReadonlyMap<string, MegaForm>;
};

export const pairwise = (
  myMember: PartyMember,
  opponentSpecies: string,
  context: MatchupContext = {},
): PairwiseScore | undefined => {
  const myBase = pokedexByKo.get(myMember.species);
  const opponentBase = pokedexByKo.get(opponentSpecies);
  if (!myBase || !opponentBase) {
    return undefined;
  }
  const myEntry = applyMega(myBase, context.myMegaByPick?.get(myMember.species));
  const opponentEntry = applyMega(opponentBase, context.opponentMegaBySpecies?.get(opponentSpecies));

  const mySpeed = myActualSpeed(myMember, myEntry.base.S);
  const opponentSpeed = opponentMaxSpeed(opponentEntry.base.S, myMember.level);
  const speedAdvantage: SpeedVerdict = mySpeed > opponentSpeed ? 'win' : mySpeed < opponentSpeed ? 'lose' : 'tie';

  const offensivePressure = offensiveScoreByMoves(myMember, myEntry.types, opponentEntry.types);
  const defensiveRisk = defensiveRiskByStab(opponentEntry.types, myEntry.types);
  const speedBias = speedAdvantage === 'win' ? 0.5 : speedAdvantage === 'lose' ? -0.5 : 0;
  const raw = offensivePressure - defensiveRisk + speedBias;
  const verdict: MatchupVerdict = raw > 0.5 ? '유리' : raw < -0.5 ? '불리' : '호각';

  return {
    myPick: myMember.species,
    opponent: opponentSpecies,
    speedAdvantage,
    offensivePressure,
    defensiveRisk,
    verdict,
  };
};

export const speedAdvantage = (
  myMember: PartyMember,
  opponentSpecies: string,
  context: MatchupContext = {},
): SpeedVerdict | undefined => pairwise(myMember, opponentSpecies, context)?.speedAdvantage;

export type LeadScore = {
  myPick: string;
  pairs: PairwiseScore[];
  favorable: number;
  unfavorable: number;
  finalScore: number;
};

const verdictValue = (verdict: MatchupVerdict): number => (verdict === '유리' ? 1 : verdict === '불리' ? -1 : 0);

export const leadScore = (
  myMember: PartyMember,
  opponents: ReadonlyArray<string>,
  context: MatchupContext = {},
): LeadScore => {
  const pairs = opponents
    .map((opponent) => pairwise(myMember, opponent, context))
    .filter((pair): pair is PairwiseScore => pair !== undefined);
  const total = pairs.reduce((sum, pair) => sum + verdictValue(pair.verdict), 0);
  const finalScore = pairs.length > 0 ? Math.round(((total / pairs.length + 1) / 2) * 100) : 50;
  return {
    myPick: myMember.species,
    pairs,
    favorable: pairs.filter((pair) => pair.verdict === '유리').length,
    unfavorable: pairs.filter((pair) => pair.verdict === '불리').length,
    finalScore,
  };
};

export type Coverage = {
  covered: number;
  total: number;
};

const COUNTER_THRESHOLD = 1.5;

export const coverage = (party: Party, opponents: ReadonlyArray<string>, context: MatchupContext = {}): Coverage => {
  const covered = opponents.filter((opponent) =>
    party.some((member) => {
      const pair = pairwise(member, opponent, context);
      return pair !== undefined && pair.offensivePressure >= COUNTER_THRESHOLD;
    }),
  ).length;
  return { covered, total: opponents.length };
};

export const leadBoard = (party: Party, opponents: ReadonlyArray<string>, context: MatchupContext = {}): LeadScore[] =>
  party.map((member) => leadScore(member, opponents, context)).sort((a, b) => b.finalScore - a.finalScore);

const combinations = <T>(items: ReadonlyArray<T>, size: number): T[][] => {
  if (size === 0) {
    return [[]];
  }
  if (items.length < size) {
    return [];
  }
  const [head, ...rest] = items;
  return [...combinations(rest, size - 1).map((combo) => [head!, ...combo]), ...combinations(rest, size)];
};

export type LineupScore = {
  picks: ReadonlyArray<string>;
  leadAvg: number;
  coveredCount: number;
  totalCount: number;
  finalScore: number;
};

export const LINEUP_SIZE = 3;

export const lineupBoard = (
  party: Party,
  opponents: ReadonlyArray<string>,
  context: MatchupContext = {},
): LineupScore[] => {
  if (party.length < LINEUP_SIZE) {
    return [];
  }
  return combinations(party, LINEUP_SIZE)
    .map((combo) => {
      const leadScores = combo.map((member) => leadScore(member, opponents, context).finalScore);
      const leadAvg = leadScores.reduce((sum, score) => sum + score, 0) / leadScores.length;
      const cov = coverage(combo, opponents, context);
      const covRatio = cov.total > 0 ? cov.covered / cov.total : 0;
      return {
        picks: combo.map((member) => member.species),
        leadAvg: Math.round(leadAvg),
        coveredCount: cov.covered,
        totalCount: cov.total,
        finalScore: Math.round(leadAvg + covRatio * 30),
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
};
