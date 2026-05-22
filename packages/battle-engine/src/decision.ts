import {
  type ChampionsSet,
  championsAssumedSet,
  championsSamples,
  findItem,
  formula,
  smogonSets,
  toShowdownId,
} from "@pokedex-agent/pokedex-core";

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

const fromChampions = (set: ChampionsSet): MyMon => ({
  species: set.species,
  level: set.level,
  ability: set.ability,
  item: set.item,
  nature: set.nature,
  evs: set.evs,
  moves: set.moves,
  mega: set.mega,
  megaForme: set.megaForme,
});

// "예상 세트": 챔피언스 사용률 1위 조합을 우선하고, 없으면 Smogon SV로 폴백한다.
export const assumedSet = (species: string): MyMon | undefined => {
  const champion = championsAssumedSet(species);
  if (champion) {
    return fromChampions(champion);
  }
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

export type GimmickChoice = "none" | "mega" | "tera";
export type GimmickOption = { gimmick: GimmickChoice; move: string; koChance: number; max: number; desc: string };
export type GimmickPlan = { recommend: GimmickChoice; options: GimmickOption[] };

// 챔피언스 기믹 1개 규칙: 메가/테라/안 씀 중 이번 공격에 KO가 가장 잘 나오는 선택을 고른다.
export const bestGimmick = (
  attacker: MyMon,
  defender: EngineSide,
  opts: { canMega?: boolean; megaForme?: "X" | "Y"; canTera?: boolean; teraType?: string },
  field?: EngineField
): GimmickPlan => {
  const variants: Array<{ gimmick: GimmickChoice; mon: MyMon }> = [{ gimmick: "none", mon: attacker }];
  if (opts.canMega) {
    variants.push({ gimmick: "mega", mon: { ...attacker, mega: true, megaForme: opts.megaForme } });
  }
  if (opts.canTera && opts.teraType) {
    variants.push({
      gimmick: "tera",
      mon: { ...attacker, terastallized: true, teraType: opts.teraType },
    });
  }
  const options = variants
    .map(({ gimmick, mon }): GimmickOption | undefined => {
      const best = bestAttack(mon, defender, field);
      return best
        ? { gimmick, move: best.move, koChance: best.koChance, max: best.max, desc: best.desc }
        : undefined;
    })
    .filter((option): option is GimmickOption => option !== undefined)
    .sort((a, b) => b.koChance - a.koChance || b.max - a.max);
  return { recommend: options[0]?.gimmick ?? "none", options };
};

export type CounterEntry = {
  setName: string;
  item?: string;
  teraType?: string;
  moves: string[];
  counters: Array<{ pick: string; move: string; koChance: number; survives: boolean }>;
};

type LabeledSet = { label: string; mon: MyMon };

// 상대 흔한 세트: 챔피언스 공개 샘플(메가·도구 포함)을 우선하고, 없으면 Smogon SV로 폴백.
const opponentSets = (species: string): LabeledSet[] => {
  const samples = championsSamples(species, 3);
  if (samples.length > 0) {
    return samples.map((set, index) => ({
      label: `${set.mega ? "메가" : "샘플"}${index + 1}${set.item ? ` (${set.item})` : ""}`,
      mon: fromChampions(set),
    }));
  }
  return smogonSets(species)
    .slice(0, 3)
    .map((set) => ({
      label: `${set.format}:${set.name}`,
      mon: {
        species,
        level: set.level ?? 50,
        item: firstOf(set.item),
        ability: firstOf(set.ability),
        nature: firstOf(set.nature),
        evs: set.evs,
        ivs: set.ivs,
        teraType: firstOf(set.teratypes),
        moves: set.moves.map((move) => firstOf(move)).filter((move): move is string => Boolean(move)),
      },
    }));
};

export const counterplay = (
  opponentSpecies: string,
  myPool: MyMon[],
  field?: EngineField
): CounterEntry[] =>
  opponentSets(opponentSpecies).map(({ label, mon: opponentMon }) => {
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
      setName: label,
      item: opponentMon.item,
      teraType: opponentMon.teraType,
      moves: opponentMon.moves,
      counters,
    };
  });
