import { findItem, formula, smogonSets, toShowdownId } from "@pokedex-agent/pokedex-core";

import {
  calcDamage,
  type CalcResult,
  type EngineField,
  type EngineSide,
  toCalcPokemon,
} from "./calc";

export type MyMon = EngineSide & { moves: string[] };

export type MoveResult = CalcResult & { move: string };
export type MatchupVerdict = "유리" | "불리" | "호각";

const firstOf = <T>(value: T | T[] | undefined): T | undefined =>
  Array.isArray(value) ? value[0] : value;

// 사용률 1위 Smogon 세트를 "예상 세트"로 본다. 메타에 없으면 undefined.
export const assumedSet = (species: string): MyMon | undefined => {
  const set = smogonSets(species)[0];
  if (!set) {
    return undefined;
  }
  return {
    species,
    level: set.level ?? 50,
    item: firstOf(set.item),
    ability: firstOf(set.ability),
    nature: firstOf(set.nature),
    evs: set.evs,
    ivs: set.ivs,
    teraType: firstOf(set.teratypes),
    moves: set.moves.map((move) => firstOf(move)).filter((move): move is string => Boolean(move)),
  };
};

const safeCalc = (attacker: MyMon, defender: EngineSide, move: string, field?: EngineField): CalcResult | undefined => {
  try {
    return calcDamage(attacker, defender, move, field);
  } catch {
    return undefined;
  }
};

export const bestAttack = (
  attacker: MyMon,
  defender: EngineSide,
  field?: EngineField
): MoveResult | undefined => {
  let best: MoveResult | undefined;
  for (const move of attacker.moves) {
    const result = safeCalc(attacker, defender, move, field);
    if (!result) {
      continue;
    }
    if (
      !best ||
      result.koChance > best.koChance ||
      (result.koChance === best.koChance && result.max > best.max)
    ) {
      best = { move, ...result };
    }
  }
  return best;
};

const isChoiceScarf = (item?: string): boolean =>
  item ? toShowdownId(findItem(item)?.en ?? item) === "choicescarf" : false;

export const speedOf = (side: MyMon | EngineSide): number => {
  const base = toCalcPokemon(side).stats.spe;
  return formula.effectiveSpeed({
    base,
    rank: side.boosts?.spe ?? 0,
    itemMultiplier: isChoiceScarf(side.item) ? 1.5 : 1,
    paralyzed: side.status === "par",
  });
};

export type Pairwise = {
  opponent: string;
  myBest?: MoveResult;
  oppBest?: MoveResult;
  faster: "win" | "lose" | "tie";
  verdict: MatchupVerdict;
  hasSet: boolean;
};

const verdictOf = (myKo: number, oppKo: number, faster: "win" | "lose" | "tie"): MatchupVerdict => {
  const speedBias = faster === "win" ? 0.15 : faster === "lose" ? -0.15 : 0;
  const score = myKo - oppKo + speedBias;
  return score > 0.2 ? "유리" : score < -0.2 ? "불리" : "호각";
};

export const pairwise = (mine: MyMon, opponentSpecies: string, field?: EngineField): Pairwise => {
  const opponentSet = assumedSet(opponentSpecies);
  const opponentSide: EngineSide = opponentSet ?? { species: opponentSpecies };
  const myBest = bestAttack(mine, opponentSide, field);
  const oppBest = opponentSet ? bestAttack(opponentSet, mine, field) : undefined;
  const mySpeed = speedOf(mine);
  const opponentSpeed = speedOf(opponentSide);
  const faster = mySpeed > opponentSpeed ? "win" : mySpeed < opponentSpeed ? "lose" : "tie";
  return {
    opponent: opponentSpecies,
    myBest,
    oppBest,
    faster,
    verdict: verdictOf(myBest?.koChance ?? 0, oppBest?.koChance ?? 0, faster),
    hasSet: Boolean(opponentSet),
  };
};

const verdictValue = (verdict: MatchupVerdict): number =>
  verdict === "유리" ? 1 : verdict === "불리" ? -1 : 0;

export type LeadScore = {
  myPick: string;
  pairs: Pairwise[];
  favorable: number;
  unfavorable: number;
  score: number;
};

export const teamSelect = (
  myTeam: MyMon[],
  opponentTeam: ReadonlyArray<string>,
  field?: EngineField
): LeadScore[] =>
  myTeam
    .map((mine) => {
      const pairs = opponentTeam.map((opponent) => pairwise(mine, opponent, field));
      const total = pairs.reduce((sum, pair) => sum + verdictValue(pair.verdict), 0);
      return {
        myPick: mine.species,
        pairs,
        favorable: pairs.filter((pair) => pair.verdict === "유리").length,
        unfavorable: pairs.filter((pair) => pair.verdict === "불리").length,
        score: pairs.length > 0 ? total / pairs.length : 0,
      };
    })
    .sort((a, b) => b.score - a.score);

export type SwitchOption = { pick: string; matchup: Pairwise };

export type BattleAdvice = {
  moveOptions: MoveResult[];
  switchOptions: SwitchOption[];
  recommendation: string;
};

export const inBattle = (
  active: MyMon,
  opponentSpecies: string,
  bench: MyMon[],
  field?: EngineField
): BattleAdvice => {
  const opponentSet = assumedSet(opponentSpecies);
  const opponentSide: EngineSide = opponentSet ?? { species: opponentSpecies };

  const moveOptions = active.moves
    .map((move) => {
      const result = safeCalc(active, opponentSide, move, field);
      return result ? { move, ...result } : undefined;
    })
    .filter((option): option is MoveResult => option !== undefined)
    .sort((a, b) => b.koChance - a.koChance || b.max - a.max);

  const switchOptions: SwitchOption[] = bench.map((mon) => ({
    pick: mon.species,
    matchup: pairwise(mon, opponentSpecies, field),
  }));
  const bestSwitch = [...switchOptions].sort(
    (a, b) => verdictValue(b.matchup.verdict) - verdictValue(a.matchup.verdict)
  )[0];

  const topMove = moveOptions[0];
  const oppKoOnMe = opponentSet ? (bestAttack(opponentSet, active, field)?.koChance ?? 0) : 0;

  let recommendation: string;
  if (topMove && topMove.koChance >= 0.5 && oppKoOnMe < 1) {
    recommendation = `${topMove.move}로 공격 (KO ${Math.round(topMove.koChance * 100)}%)`;
  } else if (bestSwitch && bestSwitch.matchup.verdict === "유리") {
    recommendation = `${bestSwitch.pick}로 교체가 유리`;
  } else if (topMove) {
    recommendation = `안전한 결정타가 없음 — ${topMove.move} 또는 교체 검토`;
  } else {
    recommendation = "유효한 옵션 없음 (상대 종족 확인)";
  }

  return { moveOptions, switchOptions, recommendation };
};

export type CounterEntry = {
  setName: string;
  item?: string;
  teraType?: string;
  moves: string[];
  counters: Array<{ pick: string; move: string; koChance: number; survives: boolean }>;
};

export const counterplay = (
  opponentSpecies: string,
  myPool: MyMon[],
  field?: EngineField
): CounterEntry[] => {
  const sets = smogonSets(opponentSpecies).slice(0, 3);
  return sets.map((set) => {
    const opponentMon: MyMon = {
      species: opponentSpecies,
      level: set.level ?? 50,
      item: firstOf(set.item),
      ability: firstOf(set.ability),
      nature: firstOf(set.nature),
      evs: set.evs,
      ivs: set.ivs,
      teraType: firstOf(set.teratypes),
      moves: set.moves.map((move) => firstOf(move)).filter((move): move is string => Boolean(move)),
    };
    const counters = myPool
      .map((mon) => {
        const myBest = bestAttack(mon, opponentMon, field);
        const oppBest = bestAttack(opponentMon, mon, field);
        if (!myBest) {
          return undefined;
        }
        return {
          pick: mon.species,
          move: myBest.move,
          koChance: myBest.koChance,
          survives: (oppBest?.koChance ?? 0) < 1,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined)
      .filter((entry) => entry.koChance >= 0.5 || entry.survives)
      .sort((a, b) => b.koChance - a.koChance);

    return {
      setName: set.name,
      item: firstOf(set.item),
      teraType: firstOf(set.teratypes),
      moves: opponentMon.moves,
      counters,
    };
  });
};
