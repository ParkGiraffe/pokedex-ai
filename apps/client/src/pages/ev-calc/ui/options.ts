import { NATURE_NAMES, type NatureName, type TeraType, TYPE_NAMES, type TypeName } from '@pokedex-agent/pokedex-core';

export type Category = '물리' | '특수';

export const ITEM_OPTIONS = [
  { value: 1, label: '없음' },
  { value: 1.2, label: '안경/머리띠 1.2배' },
  { value: 1.3, label: '생명의구슬 1.3배' },
  { value: 1.5, label: '구애 1.5배' },
] as const;

export const natureOptions = NATURE_NAMES.map((nature) => ({ value: nature, label: nature }));
export const typeOptions = TYPE_NAMES.map((type) => ({ value: type, label: type }));

export const DEFAULT_ATTACK = {
  attackerSpecies: '한카리아스',
  attackerLevel: 50,
  attackerNature: '고집' as NatureName,
  attackerEv: 32,
  category: '물리' as Category,
  moveType: '땅' as TypeName,
  movePower: 100,
  itemMultiplier: 1,
  terastalized: false,
  teraType: '땅' as TeraType,
};
