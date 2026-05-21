import { type Weather } from "@pokedex-agent/pokedex-core";
import { create } from "zustand";

type BattleTrackerState = {
  myActiveIndex: number;
  opponentSpecies: string;
  opponentHpPercent: number;
  weather: Weather | "";
  trickRoom: boolean;
  turn: number;
  setMyActiveIndex: (index: number) => void;
  setOpponentSpecies: (species: string) => void;
  setOpponentHpPercent: (hpPercent: number) => void;
  setWeather: (weather: Weather | "") => void;
  setTrickRoom: (trickRoom: boolean) => void;
  setTurn: (turn: number) => void;
};

export const useBattleStore = create<BattleTrackerState>((set) => ({
  myActiveIndex: 0,
  opponentSpecies: "마기라스",
  opponentHpPercent: 100,
  weather: "",
  trickRoom: false,
  turn: 1,
  setMyActiveIndex: (myActiveIndex) => set({ myActiveIndex }),
  setOpponentSpecies: (opponentSpecies) => set({ opponentSpecies }),
  setOpponentHpPercent: (opponentHpPercent) => set({ opponentHpPercent }),
  setWeather: (weather) => set({ weather }),
  setTrickRoom: (trickRoom) => set({ trickRoom }),
  setTurn: (turn) => set({ turn }),
}));
