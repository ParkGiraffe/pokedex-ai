import { type StatusCondition, type Weather } from '@pokedex-agent/pokedex-core';
import { create } from 'zustand';

export type RankBlock = { A: number; B: number; C: number; D: number; S: number };
const ZERO_RANKS: RankBlock = { A: 0, B: 0, C: 0, D: 0, S: 0 };

export type BattleField = {
  myStealthRock: boolean;
  mySpikes: 0 | 1 | 2 | 3;
  myStickyWeb: boolean;
  opponentLightScreen: boolean;
  opponentReflect: boolean;
  myTailwind: boolean;
  opponentTailwind: boolean;
};
const ZERO_FIELD: BattleField = {
  myStealthRock: false,
  mySpikes: 0,
  myStickyWeb: false,
  opponentLightScreen: false,
  opponentReflect: false,
  myTailwind: false,
  opponentTailwind: false,
};

type BattleTrackerState = {
  myActiveIndex: number;
  opponentSpecies: string;
  opponentHpPercent: number;
  weather: Weather | '';
  trickRoom: boolean;
  turn: number;
  myMegaForm: string;
  opponentMegaForm: string;
  myRanks: RankBlock;
  opponentRanks: RankBlock;
  myStatus: StatusCondition | '';
  opponentStatus: StatusCondition | '';
  rosterSpecies: string[];
  field: BattleField;
  setMyActiveIndex: (index: number) => void;
  setOpponentSpecies: (species: string) => void;
  setOpponentHpPercent: (hpPercent: number) => void;
  setWeather: (weather: Weather | '') => void;
  setTrickRoom: (trickRoom: boolean) => void;
  setTurn: (turn: number) => void;
  setMyMegaForm: (form: string) => void;
  setOpponentMegaForm: (form: string) => void;
  setMyRank: (stat: keyof RankBlock, value: number) => void;
  setOpponentRank: (stat: keyof RankBlock, value: number) => void;
  setMyStatus: (status: StatusCondition | '') => void;
  setOpponentStatus: (status: StatusCondition | '') => void;
  setRosterSpecies: (species: string[]) => void;
  setField: (patch: Partial<BattleField>) => void;
};

const clampRank = (value: number): number => Math.max(-6, Math.min(6, Math.round(value)));

export const useBattleStore = create<BattleTrackerState>((set) => ({
  myActiveIndex: 0,
  opponentSpecies: '마기라스',
  opponentHpPercent: 100,
  weather: '',
  trickRoom: false,
  turn: 1,
  myMegaForm: '',
  opponentMegaForm: '',
  myRanks: { ...ZERO_RANKS },
  opponentRanks: { ...ZERO_RANKS },
  myStatus: '',
  opponentStatus: '',
  rosterSpecies: [],
  field: { ...ZERO_FIELD },
  setMyActiveIndex: (myActiveIndex) => set({ myActiveIndex, myMegaForm: '', myRanks: { ...ZERO_RANKS }, myStatus: '' }),
  setOpponentSpecies: (opponentSpecies) =>
    set({ opponentSpecies, opponentMegaForm: '', opponentRanks: { ...ZERO_RANKS }, opponentStatus: '' }),
  setOpponentHpPercent: (opponentHpPercent) => set({ opponentHpPercent }),
  setWeather: (weather) => set({ weather }),
  setTrickRoom: (trickRoom) => set({ trickRoom }),
  setTurn: (turn) => set({ turn }),
  setMyMegaForm: (myMegaForm) => set({ myMegaForm }),
  setOpponentMegaForm: (opponentMegaForm) => set({ opponentMegaForm }),
  setMyRank: (stat, value) => set((state) => ({ myRanks: { ...state.myRanks, [stat]: clampRank(value) } })),
  setOpponentRank: (stat, value) =>
    set((state) => ({ opponentRanks: { ...state.opponentRanks, [stat]: clampRank(value) } })),
  setMyStatus: (myStatus) => set({ myStatus }),
  setOpponentStatus: (opponentStatus) => set({ opponentStatus }),
  setRosterSpecies: (rosterSpecies) => set({ rosterSpecies }),
  setField: (patch) => set((state) => ({ field: { ...state.field, ...patch } })),
}));
