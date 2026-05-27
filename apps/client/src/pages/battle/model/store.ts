import { type Weather } from "@pokedex-agent/pokedex-core";
import { create } from "zustand";

type BattleTrackerState = {
  myActiveIndex: number;
  opponentSpecies: string;
  opponentHpPercent: number;
  weather: Weather | "";
  trickRoom: boolean;
  turn: number;
  megaActive: boolean;
  opponentMegaForm: string; // 빈 문자열이면 비메가, 그 외엔 메가 폼 슬러그(scizor-mega 등)
  setMyActiveIndex: (index: number) => void;
  setOpponentSpecies: (species: string) => void;
  setOpponentHpPercent: (hpPercent: number) => void;
  setWeather: (weather: Weather | "") => void;
  setTrickRoom: (trickRoom: boolean) => void;
  setTurn: (turn: number) => void;
  setMegaActive: (active: boolean) => void;
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
  megaActive: false,
  opponentMegaForm: "",
  setMyActiveIndex: (myActiveIndex) => set({ myActiveIndex, megaActive: false }),
  setOpponentSpecies: (opponentSpecies) => set({ opponentSpecies, opponentMegaForm: "" }),
  setOpponentHpPercent: (opponentHpPercent) => set({ opponentHpPercent }),
  setWeather: (weather) => set({ weather }),
  setTrickRoom: (trickRoom) => set({ trickRoom }),
  setTurn: (turn) => set({ turn }),
  setMegaActive: (megaActive) => set({ megaActive }),
  setOpponentMegaForm: (opponentMegaForm) => set({ opponentMegaForm }),
}));
