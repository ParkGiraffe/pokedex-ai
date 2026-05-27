import { create } from "zustand";

export const MAX_OPPONENTS = 6;

// 종족명 → 메가 폼 슬러그. 비메가는 키 자체를 빼서 표현한다.
type MegaMap = Record<string, string>;

type MatchupState = {
  opponents: string[];
  myMegaForms: MegaMap;
  opponentMegaForms: MegaMap;
  setOpponent: (index: number, name: string) => void;
  addOpponent: () => void;
  removeOpponent: (index: number) => void;
  setMyMegaForm: (species: string, form: string) => void;
  setOpponentMegaForm: (species: string, form: string) => void;
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
}));
