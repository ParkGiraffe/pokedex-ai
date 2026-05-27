import { pokedexByKo } from "./data";
import { typeEffectiveness } from "./formula/matchup";
import { actualStat } from "./formula/stat";
import type { Party, PartyMember, TypeName } from "./types";

export type SpeedVerdict = "win" | "lose" | "tie";
export type MatchupVerdict = "유리" | "불리" | "호각";

export type PairwiseScore = {
  myPick: string;
  opponent: string;
  speedAdvantage: SpeedVerdict;
  offensivePressure: number;
  defensiveRisk: number;
  verdict: MatchupVerdict;
};

const bestStab = (attackerTypes: ReadonlyArray<TypeName>, defenderTypes: ReadonlyArray<TypeName>): number =>
  Math.max(...attackerTypes.map((type) => typeEffectiveness(type, defenderTypes)));

// 내 픽은 실투자 스피드, 상대는 최대 투자(32포인트·+성격·31)를 가정해 보수적으로 본다.
const myActualSpeed = (member: PartyMember, baseSpeed: number): number =>
  actualStat({
    stat: "S",
    base: baseSpeed,
    iv: member.ivs.S,
    ev: member.evs.S,
    level: member.level,
    nature: member.nature,
  });

const opponentMaxSpeed = (baseSpeed: number, level: number): number =>
  actualStat({ stat: "S", base: baseSpeed, iv: 31, ev: 32, level, nature: "겁쟁이" });

export const pairwise = (
  myMember: PartyMember,
  opponentSpecies: string
): PairwiseScore | undefined => {
  const myEntry = pokedexByKo.get(myMember.species);
  const opponentEntry = pokedexByKo.get(opponentSpecies);
  if (!myEntry || !opponentEntry) {
    return undefined;
  }

  const mySpeed = myActualSpeed(myMember, myEntry.base.S);
  const opponentSpeed = opponentMaxSpeed(opponentEntry.base.S, myMember.level);
  const speedAdvantage: SpeedVerdict =
    mySpeed > opponentSpeed ? "win" : mySpeed < opponentSpeed ? "lose" : "tie";

  const offensivePressure = bestStab(myEntry.types, opponentEntry.types);
  const defensiveRisk = bestStab(opponentEntry.types, myEntry.types);
  const speedBias = speedAdvantage === "win" ? 0.5 : speedAdvantage === "lose" ? -0.5 : 0;
  const raw = offensivePressure - defensiveRisk + speedBias;
  const verdict: MatchupVerdict = raw > 0.5 ? "유리" : raw < -0.5 ? "불리" : "호각";

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
  opponentSpecies: string
): SpeedVerdict | undefined => pairwise(myMember, opponentSpecies)?.speedAdvantage;

export type LeadScore = {
  myPick: string;
  pairs: PairwiseScore[];
  favorable: number;
  unfavorable: number;
  finalScore: number;
};

const verdictValue = (verdict: MatchupVerdict): number =>
  verdict === "유리" ? 1 : verdict === "불리" ? -1 : 0;

export const leadScore = (myMember: PartyMember, opponents: ReadonlyArray<string>): LeadScore => {
  const pairs = opponents
    .map((opponent) => pairwise(myMember, opponent))
    .filter((pair): pair is PairwiseScore => pair !== undefined);
  const total = pairs.reduce((sum, pair) => sum + verdictValue(pair.verdict), 0);
  const finalScore = pairs.length > 0 ? Math.round(((total / pairs.length + 1) / 2) * 100) : 50;
  return {
    myPick: myMember.species,
    pairs,
    favorable: pairs.filter((pair) => pair.verdict === "유리").length,
    unfavorable: pairs.filter((pair) => pair.verdict === "불리").length,
    finalScore,
  };
};

export type Coverage = {
  covered: number;
  total: number;
};

export const coverage = (party: Party, opponents: ReadonlyArray<string>): Coverage => {
  const covered = opponents.filter((opponent) =>
    party.some((member) => {
      const pair = pairwise(member, opponent);
      return pair !== undefined && pair.offensivePressure >= 2;
    })
  ).length;
  return { covered, total: opponents.length };
};

export const leadBoard = (party: Party, opponents: ReadonlyArray<string>): LeadScore[] =>
  party.map((member) => leadScore(member, opponents)).sort((a, b) => b.finalScore - a.finalScore);
