import {
  type BattleState,
  decision,
  findMegaByItem,
  findPokemon,
  type Party,
  type PartyMember,
  PERFECT_IVS,
  type Weather,
} from "@pokedex-agent/pokedex-core";

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
  megaActive: boolean;
};

// 액티브가 메가스톤을 들었을 때만 메가 폼을 적용 가능하다고 본다.
export const activeMega = (input: BattleInput) => {
  const myActive = input.myParty[input.myActiveIndex];
  return myActive?.item ? findMegaByItem(myActive.item) : undefined;
};

export const battleOptions = (input: BattleInput): decision.MoveOption[] | undefined => {
  const myActive = input.myParty[input.myActiveIndex];
  if (!myActive) {
    return undefined;
  }
  const mega = input.megaActive ? activeMega(input) : undefined;
  return decision.moveOptions(myActive, input.opponentSpecies, input.opponentHpPercent, { mega });
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
