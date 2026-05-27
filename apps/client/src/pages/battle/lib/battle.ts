import {
  type BattleState,
  decision,
  findMegasBySpecies,
  findPokemon,
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
