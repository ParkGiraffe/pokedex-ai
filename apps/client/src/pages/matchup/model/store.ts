import { create } from 'zustand';

export const MAX_OPPONENTS = 6;

type MegaMap = Record<string, string>;

type MatchupState = {
  opponents: string[];
  myMegaForms: MegaMap;
  opponentMegaForms: MegaMap;
  selectedSpecies: string[];
  setOpponent: (index: number, name: string) => void;
  addOpponent: () => void;
  removeOpponent: (index: number) => void;
  setMyMegaForm: (species: string, form: string) => void;
  setOpponentMegaForm: (species: string, form: string) => void;
  setSelectedSpecies: (species: string[]) => void;
};

const withForm = (map: MegaMap, species: string, form: string): MegaMap => {
  const next = { ...map };
  if (form) {
    next[species] = form;
  } else {
    delete next[species];
  }
  return next;
};

export const useMatchupStore = create<MatchupState>((set) => ({
  opponents: ['리자몽'],
  myMegaForms: {},
  opponentMegaForms: {},
  selectedSpecies: [],
  setOpponent: (index, name) =>
    set((state) => {
      const prev = state.opponents[index] ?? '';
      const opponents = state.opponents.map((value, i) => (i === index ? name : value));
      const opponentMegaForms =
        prev && prev !== name ? withForm(state.opponentMegaForms, prev, '') : state.opponentMegaForms;
      return { opponents, opponentMegaForms };
    }),
  addOpponent: () =>
    set((state) => (state.opponents.length >= MAX_OPPONENTS ? state : { opponents: [...state.opponents, ''] })),
  removeOpponent: (index) =>
    set((state) => {
      const removed = state.opponents[index];
      const opponents = state.opponents.filter((_, i) => i !== index);
      const opponentMegaForms =
        removed && !opponents.includes(removed)
          ? withForm(state.opponentMegaForms, removed, '')
          : state.opponentMegaForms;
      return { opponents, opponentMegaForms };
    }),
  setMyMegaForm: (species, form) => set((state) => ({ myMegaForms: withForm(state.myMegaForms, species, form) })),
  setOpponentMegaForm: (species, form) =>
    set((state) => ({ opponentMegaForms: withForm(state.opponentMegaForms, species, form) })),
  setSelectedSpecies: (species) => set({ selectedSpecies: species }),
}));
