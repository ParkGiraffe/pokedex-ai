import { type StatusCondition, type Weather } from "@pokedex-agent/pokedex-core";
import { create } from "zustand";

export type RankBlock = { A: number; B: number; C: number; D: number; S: number };
const ZERO_RANKS: RankBlock = { A: 0, B: 0, C: 0, D: 0, S: 0 };

type BattleTrackerState = {
  myActiveIndex: number;
  opponentSpecies: string;
  opponentHpPercent: number;
  weather: Weather | "";
  trickRoom: boolean;
  turn: number;
  myMegaForm: string; // 내 액티브 메가 폼 슬러그. "" = 비메가.
  opponentMegaForm: string; // 상대 메가 폼 슬러그. "" = 비메가.
  myRanks: RankBlock; // 내 액티브 랭크 (-6..+6).
  opponentRanks: RankBlock; // 상대 랭크.
  myStatus: StatusCondition | ""; // 화상이면 물리 공격 ÷2, 마비면 스피드 ÷2.
  opponentStatus: StatusCondition | "";
  setMyActiveIndex: (index: number) => void;
  setOpponentSpecies: (species: string) => void;
  setOpponentHpPercent: (hpPercent: number) => void;
  setWeather: (weather: Weather | "") => void;
  setTrickRoom: (trickRoom: boolean) => void;
  setTurn: (turn: number) => void;
  setMyMegaForm: (form: string) => void;
  setOpponentMegaForm: (form: string) => void;
  setMyRank: (stat: keyof RankBlock, value: number) => void;
  setOpponentRank: (stat: keyof RankBlock, value: number) => void;
  setMyStatus: (status: StatusCondition | "") => void;
  setOpponentStatus: (status: StatusCondition | "") => void;
};

const clampRank = (value: number): number => Math.max(-6, Math.min(6, Math.round(value)));

// 종족 교체 시 메가·랭크·상태를 자동 해제한다 (다른 종족이 같은 상태를 물려받지 않도록).
export const useBattleStore = create<BattleTrackerState>((set) => ({
  myActiveIndex: 0,
  opponentSpecies: "마기라스",
  opponentHpPercent: 100,
  weather: "",
  trickRoom: false,
  turn: 1,
  myMegaForm: "",
  opponentMegaForm: "",
  myRanks: { ...ZERO_RANKS },
  opponentRanks: { ...ZERO_RANKS },
  myStatus: "",
  opponentStatus: "",
  setMyActiveIndex: (myActiveIndex) =>
    set({ myActiveIndex, myMegaForm: "", myRanks: { ...ZERO_RANKS }, myStatus: "" }),
  setOpponentSpecies: (opponentSpecies) =>
    set({ opponentSpecies, opponentMegaForm: "", opponentRanks: { ...ZERO_RANKS }, opponentStatus: "" }),
  setOpponentHpPercent: (opponentHpPercent) => set({ opponentHpPercent }),
  setWeather: (weather) => set({ weather }),
  setTrickRoom: (trickRoom) => set({ trickRoom }),
  setTurn: (turn) => set({ turn }),
  setMyMegaForm: (myMegaForm) => set({ myMegaForm }),
  setOpponentMegaForm: (opponentMegaForm) => set({ opponentMegaForm }),
  setMyRank: (stat, value) =>
    set((state) => ({ myRanks: { ...state.myRanks, [stat]: clampRank(value) } })),
  setOpponentRank: (stat, value) =>
    set((state) => ({ opponentRanks: { ...state.opponentRanks, [stat]: clampRank(value) } })),
  setMyStatus: (myStatus) => set({ myStatus }),
  setOpponentStatus: (opponentStatus) => set({ opponentStatus }),
}));
