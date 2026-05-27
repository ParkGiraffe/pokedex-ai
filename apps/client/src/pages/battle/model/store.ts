import { type Weather } from "@pokedex-agent/pokedex-core";
import { create } from "zustand";

type BattleTrackerState = {
  myActiveIndex: number;
  opponentSpecies: string;
  opponentHpPercent: number;
  weather: Weather | "";
  trickRoom: boolean;
  turn: number;
  myMegaForm: string; // 내 액티브 메가 폼 슬러그. "" = 비메가.
  opponentMegaForm: string; // 상대 메가 폼 슬러그. "" = 비메가.
  setMyActiveIndex: (index: number) => void;
  setOpponentSpecies: (species: string) => void;
  setOpponentHpPercent: (hpPercent: number) => void;
  setWeather: (weather: Weather | "") => void;
  setTrickRoom: (trickRoom: boolean) => void;
  setTurn: (turn: number) => void;
  setMyMegaForm: (form: string) => void;
  setOpponentMegaForm: (form: string) => void;
};

// 종족 교체 시 메가 상태를 자동 해제한다 (다른 종족이 같은 상태를 물려받지 않도록).
export const useBattleStore = create<BattleTrackerState>((set) => ({
  myActiveIndex: 0,
  opponentSpecies: "마기라스",
  opponentHpPercent: 100,
  weather: "",
  trickRoom: false,
  turn: 1,
  myMegaForm: "",
  opponentMegaForm: "",
  setMyActiveIndex: (myActiveIndex) => set({ myActiveIndex, myMegaForm: "" }),
  setOpponentSpecies: (opponentSpecies) => set({ opponentSpecies, opponentMegaForm: "" }),
  setOpponentHpPercent: (opponentHpPercent) => set({ opponentHpPercent }),
  setWeather: (weather) => set({ weather }),
  setTrickRoom: (trickRoom) => set({ trickRoom }),
  setTurn: (turn) => set({ turn }),
  setMyMegaForm: (myMegaForm) => set({ myMegaForm }),
  setOpponentMegaForm: (opponentMegaForm) => set({ opponentMegaForm }),
}));
