import { create } from "zustand";

export const MAX_OPPONENTS = 6;

// 종족명 → 메가 폼 슬러그. 비메가는 키 자체를 빼서 표현한다.
type MegaMap = Record<string, string>;

type MatchupState = {
  opponents: string[];
  myMegaForms: MegaMap;
  opponentMegaForms: MegaMap;
  // 사용자가 명시적으로 선택한 선출 3마리 종족. 비어 있으면 자동 추천(lineupBoard 1위)이 적용된다.
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

// 상대 종족 슬롯 변경 시 그 슬롯의 옛 종족 메가 매핑은 자동 정리한다.
export const useMatchupStore = create<MatchupState>((set) => ({
  opponents: ["리자몽"],
  myMegaForms: {},
  opponentMegaForms: {},
  selectedSpecies: [],
  setOpponent: (index, name) =>
    set((state) => {
      const prev = state.opponents[index] ?? "";
      const opponents = state.opponents.map((value, i) => (i === index ? name : value));
      const opponentMegaForms = prev && prev !== name ? withForm(state.opponentMegaForms, prev, "") : state.opponentMegaForms;
      return { opponents, opponentMegaForms };
    }),
  addOpponent: () =>
    set((state) =>
      state.opponents.length >= MAX_OPPONENTS ? state : { opponents: [...state.opponents, ""] }
    ),
  removeOpponent: (index) =>
    set((state) => {
      const removed = state.opponents[index];
      const opponents = state.opponents.filter((_, i) => i !== index);
      const opponentMegaForms = removed && !opponents.includes(removed)
        ? withForm(state.opponentMegaForms, removed, "")
        : state.opponentMegaForms;
      return { opponents, opponentMegaForms };
    }),
  setMyMegaForm: (species, form) =>
    set((state) => ({ myMegaForms: withForm(state.myMegaForms, species, form) })),
  setOpponentMegaForm: (species, form) =>
    set((state) => ({ opponentMegaForms: withForm(state.opponentMegaForms, species, form) })),
  setSelectedSpecies: (species) => set({ selectedSpecies: species }),
}));
