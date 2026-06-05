import { type NatureName, type TeraType, type TypeName } from '@pokedex-agent/pokedex-core';
import { create } from 'zustand';

export type Category = '물리' | '특수';

export type AttackerInput = {
  species: string;
  level: number;
  category: Category;
  ev: number;
  nature: NatureName;
  rank: number;
  moveType: TypeName;
  movePower: number;
  terastalized: boolean;
  teraType: TeraType;
  itemMultiplier: number;
  weatherBoost: 1 | 1.5 | 0.5;
  critical: boolean;
  burned: boolean;
};

export type DefenderInput = {
  species: string;
  level: number;
  hpEv: number;
  defEv: number;
  nature: NatureName;
  rank: number;
};

type CalculatorState = {
  attacker: AttackerInput;
  defender: DefenderInput;
  setAttacker: (patch: Partial<AttackerInput>) => void;
  setDefender: (patch: Partial<DefenderInput>) => void;
};

const DEFAULT_ATTACKER: AttackerInput = {
  species: '한카리아스',
  level: 50,
  category: '물리',
  ev: 32,
  nature: '고집',
  rank: 0,
  moveType: '땅',
  movePower: 100,
  terastalized: false,
  teraType: '땅',
  itemMultiplier: 1,
  weatherBoost: 1,
  critical: false,
  burned: false,
};

const DEFAULT_DEFENDER: DefenderInput = {
  species: '한카리아스',
  level: 50,
  hpEv: 0,
  defEv: 0,
  nature: '노력',
  rank: 0,
};

export const useCalculatorStore = create<CalculatorState>((set) => ({
  attacker: DEFAULT_ATTACKER,
  defender: DEFAULT_DEFENDER,
  setAttacker: (patch) => set((state) => ({ attacker: { ...state.attacker, ...patch } })),
  setDefender: (patch) => set((state) => ({ defender: { ...state.defender, ...patch } })),
}));
