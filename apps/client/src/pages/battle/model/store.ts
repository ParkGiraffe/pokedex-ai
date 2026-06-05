import { type StatusCondition, type Weather } from '@pokedex-agent/pokedex-core';
import { create } from 'zustand';

export type RankBlock = { A: number; B: number; C: number; D: number; S: number };
const ZERO_RANKS: RankBlock = { A: 0, B: 0, C: 0, D: 0, S: 0 };

// 필드 상태. 진입 위험(hazard)은 내 쪽 기준(내 교체 진입 시), 스크린은 상대 쪽(내 공격 반감) 기준.
export type BattleField = {
  myStealthRock: boolean; // 내 쪽 스텔스록 — 교체 진입 시 바위 상성 데미지
  mySpikes: 0 | 1 | 2 | 3; // 내 쪽 압정 층수 — 비행 제외 진입 데미지
  myStickyWeb: boolean; // 내 쪽 끈적네트 — 진입 시 스피드 -1 (비행 제외)
  opponentLightScreen: boolean; // 상대 빛의장막 — 내 특수기 0.5배
  opponentReflect: boolean; // 상대 리플렉터 — 내 물리기 0.5배
  myTailwind: boolean; // 내 순풍 — 스피드 2배
  opponentTailwind: boolean; // 상대 순풍 — 상대 스피드 2배
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
  myMegaForm: string; // 내 액티브 메가 폼 슬러그. "" = 비메가.
  opponentMegaForm: string; // 상대 메가 폼 슬러그. "" = 비메가.
  myRanks: RankBlock; // 내 액티브 랭크 (-6..+6).
  opponentRanks: RankBlock; // 상대 랭크.
  myStatus: StatusCondition | ''; // 화상이면 물리 공격 ÷2, 마비면 스피드 ÷2.
  opponentStatus: StatusCondition | '';
  // 배틀에 살아있는(교체 가능한) 내 포켓몬 종족. 빈 배열이면 파티 전체가 살아있는 것으로 본다.
  // 기절 시 토글을 꺼서 액티브·교체 후보에서 제외한다 (1~6마리 자유).
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

// 종족 교체 시 메가·랭크·상태를 자동 해제한다 (다른 종족이 같은 상태를 물려받지 않도록).
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
