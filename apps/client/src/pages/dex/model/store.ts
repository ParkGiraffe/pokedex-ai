import { type TypeName } from '@pokedex-agent/pokedex-core';
import { create } from 'zustand';

import { ALL_GENERATIONS, ALL_TYPES } from '../lib/search';

type DexState = {
  query: string;
  type: TypeName | typeof ALL_TYPES;
  generation: number;
  page: number;
  selectedNo: number | null;
  setQuery: (query: string) => void;
  setType: (type: TypeName | typeof ALL_TYPES) => void;
  setGeneration: (generation: number) => void;
  setPage: (page: number) => void;
  select: (no: number | null) => void;
};

export const useDexStore = create<DexState>((set) => ({
  query: '',
  type: ALL_TYPES,
  generation: ALL_GENERATIONS,
  page: 1,
  selectedNo: 1,
  setQuery: (query) => set({ query, page: 1 }),
  setType: (type) => set({ type, page: 1 }),
  setGeneration: (generation) => set({ generation, page: 1 }),
  setPage: (page) => set({ page }),
  select: (selectedNo) => set({ selectedNo }),
}));
