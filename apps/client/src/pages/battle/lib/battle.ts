import {
  type BattleState,
  decision,
  findMegasBySpecies,
  findPokemon,
  matchup,
  type MegaForm,
  type Party,
  type PartyMember,
  PERFECT_IVS,
  type StatusCondition,
  type Weather,
} from "@pokedex-agent/pokedex-core";

import { type RankBlock } from "../model/store";

const DEFAULT_RANKS = { A: 0, B: 0, C: 0, D: 0, S: 0, accuracy: 0, evasion: 0 };

// 상대 액티브는 종족만 알 수 있으므로 나머지 필드는 자리표시자로 채운다(export는 종족·HP만 사용).
const stubOpponent = (species: string, level: number): PartyMember => ({
  species,
  level,
  nature: "노력",
  ability: "?",
  teraType: "노말",
  moves: ["?", "?", "?", "?"],
  evs: { H: 0, A: 0, B: 0, C: 0, D: 0, S: 0 },
  ivs: PERFECT_IVS,
});

export type BattleInput = {
  myParty: Party;
  myActiveIndex: number;
  opponentSpecies: string;
  opponentHpPercent: number;
  weather: Weather | "";
  trickRoom: boolean;
  turn: number;
  // 메가 폼 슬러그. "" = 비메가. 종족이 메가 가능하면 토글로 자동(1개) 또는 select(X/Y).
  myMegaForm: string;
  opponentMegaForm: string;
  // 랭크·상태는 데미지 계산에 직접 반영된다.
  myRanks: RankBlock;
  opponentRanks: RankBlock;
  myStatus: StatusCondition | "";
  opponentStatus: StatusCondition | "";
};

// 내 액티브 종족의 가능한 메가 폼 목록.
export const activeMegaOptions = (input: BattleInput): MegaForm[] => {
  const myActive = input.myParty[input.myActiveIndex];
  return myActive ? findMegasBySpecies(myActive.species) : [];
};

// 상대 종족의 가능한 메가 폼 목록.
export const opponentMegaOptions = (input: BattleInput): MegaForm[] =>
  findMegasBySpecies(input.opponentSpecies);

const resolveMega = (options: MegaForm[], slug: string): MegaForm | undefined =>
  slug ? options.find((mega) => mega.form === slug) : undefined;

export const battleOptions = (input: BattleInput): decision.MoveOption[] | undefined => {
  const myActive = input.myParty[input.myActiveIndex];
  if (!myActive) {
    return undefined;
  }
  const mega = resolveMega(activeMegaOptions(input), input.myMegaForm);
  const opponentMega = resolveMega(opponentMegaOptions(input), input.opponentMegaForm);
  return decision.moveOptions(myActive, input.opponentSpecies, input.opponentHpPercent, {
    mega,
    opponentMega,
    myRanks: input.myRanks,
    opponentRanks: input.opponentRanks,
    myStatus: input.myStatus,
  });
};

export type SwitchOption = { pick: string; verdict: matchup.MatchupVerdict };
export type BattleAdvice = {
  moveOptions: decision.MoveOption[];
  switchOptions: SwitchOption[];
  recommendation: string;
};

const verdictRank = (verdict: matchup.MatchupVerdict): number =>
  verdict === "유리" ? 1 : verdict === "불리" ? -1 : 0;

// 한글 종성 검사로 "으로"/"로" 조사를 자연스럽게 붙인다. 한글 밖 문자는 기본 "로".
const withLo = (word: string): string => {
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xac00 || last > 0xd7a3) {
    return `${word}로`;
  }
  return (last - 0xac00) % 28 === 0 ? `${word}로` : `${word}으로`;
};

// 결정론 인배틀 어드바이저. ranks·status·메가가 데미지/매치업 계산에 그대로 반영된다.
export const battleAdvice = (input: BattleInput): BattleAdvice | undefined => {
  const myActive = input.myParty[input.myActiveIndex];
  if (!myActive || !findPokemon(input.opponentSpecies)) {
    return undefined;
  }
  const moves = battleOptions(input) ?? [];
  const mega = resolveMega(activeMegaOptions(input), input.myMegaForm);
  const opponentMega = resolveMega(opponentMegaOptions(input), input.opponentMegaForm);
  const matchupContext: matchup.MatchupContext = {
    myMegaByPick: mega ? new Map([[myActive.species, mega]]) : undefined,
    opponentMegaBySpecies: opponentMega
      ? new Map([[input.opponentSpecies, opponentMega]])
      : undefined,
  };
  const bench = input.myParty.filter((_, index) => index !== input.myActiveIndex);
  const switchOptions: SwitchOption[] = bench
    .map((mon) => {
      const pair = matchup.pairwise(mon, input.opponentSpecies, matchupContext);
      return pair ? { pick: mon.species, verdict: pair.verdict } : undefined;
    })
    .filter((option): option is SwitchOption => option !== undefined);

  const topMove = [...moves]
    .filter((option) => option.damaging)
    .sort((a, b) => b.koChance - a.koChance || b.max - a.max)[0];
  const bestSwitch = [...switchOptions].sort(
    (a, b) => verdictRank(b.verdict) - verdictRank(a.verdict)
  )[0];

  let recommendation: string;
  if (topMove && topMove.koChance >= 0.5) {
    recommendation = `${withLo(topMove.move)} 노림 (${topMove.hitsText}, KO ${Math.round(topMove.koChance * 100)}%)`;
  } else if (bestSwitch && bestSwitch.verdict === "유리") {
    recommendation = `${withLo(bestSwitch.pick)} 빼는 게 유리`;
  } else if (topMove) {
    recommendation = `결정타 없음 — ${topMove.move} 또는 교체 검토`;
  } else {
    recommendation = "유효 옵션 없음 (상대 종족 확인)";
  }

  return { moveOptions: moves, switchOptions, recommendation };
};

export const buildBattleState = (input: BattleInput): BattleState | undefined => {
  const myActive = input.myParty[input.myActiveIndex];
  if (!myActive || !findPokemon(input.opponentSpecies)) {
    return undefined;
  }
  return {
    my: input.myParty,
    opponent: {
      revealed: [{ species: input.opponentSpecies }],
      field: [
        {
          member: stubOpponent(input.opponentSpecies, myActive.level),
          hpPercent: input.opponentHpPercent,
          ranks: DEFAULT_RANKS,
          terastalized: false,
        },
      ],
    },
    myField: [{ member: myActive, hpPercent: 100, ranks: DEFAULT_RANKS, terastalized: false }],
    weather: input.weather || undefined,
    trickRoom: input.trickRoom,
    turn: input.turn,
  };
};
