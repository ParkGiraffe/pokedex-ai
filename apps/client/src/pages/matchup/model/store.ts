import { create } from "zustand";

export const MAX_OPPONENTS = 6;

type MatchupState = {
  opponents: string[];
  setOpponent: (index: number, name: string) => void;
  addOpponent: () => void;
  removeOpponent: (index: number) => void;
};

export const useMatchupStore = create<MatchupState>((set) => ({
  opponents: ["리자몽"],
  setOpponent: (index, name) =>
    set((state) => ({ opponents: state.opponents.map((value, i) => (i === index ? name : value)) })),
  addOpponent: () =>
    set((state) =>
      state.opponents.length >= MAX_OPPONENTS ? state : { opponents: [...state.opponents, ""] }
    ),
  removeOpponent: (index) =>
    set((state) => ({ opponents: state.opponents.filter((_, i) => i !== index) })),
}));
