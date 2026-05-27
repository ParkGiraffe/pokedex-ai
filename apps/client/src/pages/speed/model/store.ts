import { type NatureName } from "@pokedex-agent/pokedex-core";
import { create } from "zustand";

export type SpeedSide = {
  species: string;
  level: number;
  ev: number;
  nature: NatureName;
  rank: number;
  itemMultiplier: number;
  abilityMultiplier: number;
  paralyzed: boolean;
  stickyWeb: boolean;
  tailwind: boolean;
};

type SpeedState = {
  left: SpeedSide;
  right: SpeedSide;
  trickRoom: boolean;
  setLeft: (patch: Partial<SpeedSide>) => void;
  setRight: (patch: Partial<SpeedSide>) => void;
  setTrickRoom: (trickRoom: boolean) => void;
};

const makeSide = (species: string, nature: NatureName): SpeedSide => ({
  species,
  level: 50,
  ev: 32,
  nature,
  rank: 0,
  itemMultiplier: 1,
  abilityMultiplier: 1,
  paralyzed: false,
  stickyWeb: false,
  tailwind: false,
});

export const useSpeedStore = create<SpeedState>((set) => ({
  left: makeSide("한카리아스", "겁쟁이"),
  right: makeSide("리자몽", "겁쟁이"),
  trickRoom: false,
  setLeft: (patch) => set((state) => ({ left: { ...state.left, ...patch } })),
  setRight: (patch) => set((state) => ({ right: { ...state.right, ...patch } })),
  setTrickRoom: (trickRoom) => set({ trickRoom }),
}));
