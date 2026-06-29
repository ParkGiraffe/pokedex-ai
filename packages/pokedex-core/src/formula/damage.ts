import type { TeraType, TypeName } from '../types';
import { typeEffectiveness } from './matchup';

export type DamageCategory = '물리' | '특수';

export type DamageInput = {
  level: number;
  attack: number;
  defense: number;
  basePower: number;
  category: DamageCategory;
  attackerTypes: ReadonlyArray<TypeName>;
  defenderTypes: ReadonlyArray<TypeName>;
  moveType: TypeName;
  attackerTeraType?: TeraType;
  attackerTerastalized: boolean;
  stab?: boolean;
  critical?: boolean;
  weatherBoost?: 1 | 1.5 | 0.5;
  itemMultiplier?: number;
  burned?: boolean;
  screen?: boolean;
};

export type DamageResult = {
  min: number;
  max: number;
  rolls: number[];
  effectiveness: number;
};

const RANDOM_ROLLS = [85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] as const;

const pokeRound = (n: number): number => (n - Math.floor(n) > 0.5 ? Math.ceil(n) : Math.floor(n));

const applyMod = (damage: number, mod: number): number => pokeRound((damage * mod) / 4096);

const toMod = (multiplier: number): number => Math.round(multiplier * 4096);

const stabMod = (input: DamageInput): number => {
  const isOriginalStab = input.attackerTypes.includes(input.moveType);
  const tera = input.attackerTerastalized ? input.attackerTeraType : undefined;

  if (tera === '스텔라') {
    return isOriginalStab ? 8192 : 4915;
  }

  if (tera) {
    const isTeraStab = input.moveType === tera;
    if (isTeraStab && isOriginalStab) return 8192;
    if (isTeraStab || isOriginalStab) return 6144;
    return 4096;
  }

  return isOriginalStab ? 6144 : 4096;
};

export const calculateDamage = (input: DamageInput): DamageResult => {
  const {
    level,
    attack,
    defense,
    basePower,
    category,
    moveType,
    defenderTypes,
    critical = false,
    weatherBoost = 1,
    itemMultiplier = 1,
    burned = false,
    screen = false,
  } = input;

  const effectiveness = typeEffectiveness(moveType, defenderTypes);
  if (effectiveness === 0) {
    return { min: 0, max: 0, rolls: Array<number>(16).fill(0), effectiveness: 0 };
  }

  const effectiveAttack = burned && category === '물리' ? Math.floor(attack / 2) : attack;

  const base =
    Math.floor(Math.floor((Math.floor((2 * level) / 5 + 2) * basePower * effectiveAttack) / defense) / 50) + 2;

  let damage = base;
  const weatherMod = weatherBoost === 1.5 ? 6144 : weatherBoost === 0.5 ? 2048 : 4096;
  if (weatherMod !== 4096) damage = applyMod(damage, weatherMod);
  if (critical) damage = applyMod(damage, 6144);

  const stab = stabMod(input);
  const item = toMod(itemMultiplier);

  const screenActive = screen && !critical;

  const rolls = RANDOM_ROLLS.map((r) => {
    let d = Math.floor((damage * r) / 100);
    d = applyMod(d, stab);
    d = Math.floor(d * effectiveness);
    if (screenActive) d = applyMod(d, 2048);
    if (item !== 4096) d = applyMod(d, item);
    return Math.max(1, d);
  });

  return {
    min: rolls[0]!,
    max: rolls[15]!,
    rolls: [...rolls],
    effectiveness,
  };
};

export const stealthRockDamage = (defenderTypes: ReadonlyArray<TypeName>, maxHp: number): number => {
  const eff = typeEffectiveness('바위', defenderTypes);
  return Math.floor((maxHp * eff) / 8);
};

export const spikesDamage = (defenderTypes: ReadonlyArray<TypeName>, maxHp: number, layers: 1 | 2 | 3): number => {
  if (defenderTypes.includes('비행')) {
    return 0;
  }
  const fraction = layers === 1 ? 8 : layers === 2 ? 6 : 4;
  return Math.floor(maxHp / fraction);
};
