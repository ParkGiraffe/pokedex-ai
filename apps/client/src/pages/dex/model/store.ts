import { type TypeName } from "@pokedex-agent/pokedex-core";
import { create } from "zustand";

import { ALL_GENERATIONS, ALL_TYPES } from "../lib/search";

type DexState = {
  query: string;
  type: TypeName | typeof ALL_TYPES;
  generation: number;
  selectedNo: number | null;
  setQuery: (query: string) => void;
  setType: (type: TypeName | typeof ALL_TYPES) => void;
  setGeneration: (generation: number) => void;
  select: (no: number | null) => void;
};

export const useDexStore = create<DexState>((set) => ({
  query: "",
  type: ALL_TYPES,
  generation: ALL_GENERATIONS,
  selectedNo: 1,
  setQuery: (query) => set({ query }),
  setType: (type) => set({ type }),
  setGeneration: (generation) => set({ generation }),
  select: (selectedNo) => set({ selectedNo }),
}));
