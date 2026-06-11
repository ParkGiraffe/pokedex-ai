import type { TeraType, TypeName } from '../types';
import { typeEffectiveness } from './matchup';

export type DamageCategory = '물리' | '특수';

export type DamageInput = {
  level: number;
  attack: number; // 실수치 (랭크·도구·특성 미리 반영)
  defense: number; // 실수치
  basePower: number;
  category: DamageCategory;
  attackerTypes: ReadonlyArray<TypeName>;
  defenderTypes: ReadonlyArray<TypeName>;
  moveType: TypeName;
  attackerTeraType?: TeraType;
  attackerTerastalized: boolean;
  stab?: boolean; // 호환용. 미지정 시 attackerTypes로 자속을 판정한다.
  critical?: boolean;
  weatherBoost?: 1 | 1.5 | 0.5; // 날씨에 의한 위력 보정 (불꽃-맑음 1.5, 물-맑음 0.5 등)
  itemMultiplier?: number; // 도구 종합 보정 (생명의구슬 1.3, 안경 1.2 등)
  burned?: boolean; // 화상 (물리 공격 실수치 절반)
  screen?: boolean; // 상대 빛의장막(특수)/리플렉터(물리). 싱글 0.5배, 급소면 무시.
};

export type DamageResult = {
  min: number;
  max: number;
  rolls: number[];
  effectiveness: number;
};

const RANDOM_ROLLS = [85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] as const;

// SV 데미지는 4096 고정소수점 모디파이어와 pokeRound(반내림)를 쓴다.
const pokeRound = (n: number): number => (n - Math.floor(n) > 0.5 ? Math.ceil(n) : Math.floor(n));

const applyMod = (damage: number, mod: number): number => pokeRound((damage * mod) / 4096);

const toMod = (multiplier: number): number => Math.round(multiplier * 4096);

const stabMod = (input: DamageInput): number => {
  const isOriginalStab = input.attackerTypes.includes(input.moveType);
  const tera = input.attackerTerastalized ? input.attackerTeraType : undefined;

  if (tera === '스텔라') {
    return isOriginalStab ? 8192 : 4915; // 자속 2.0, 비자속 1.2
  }

  if (tera) {
    const isTeraStab = input.moveType === tera;
    if (isTeraStab && isOriginalStab) return 8192; // 테라 자속 + 원본 자속 = 2.0
    if (isTeraStab || isOriginalStab) return 6144; // 한쪽만 자속 = 1.5
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

  // 스크린은 급소가 아닐 때만 0.5배. 싱글 기준 2048/4096.
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

// 스텔스록 진입 데미지(최대 HP 비율). 바위 타입 상성 × 1/8. 비행 2배=1/4, 4배=1/2.
export const stealthRockDamage = (defenderTypes: ReadonlyArray<TypeName>, maxHp: number): number => {
  const eff = typeEffectiveness('바위', defenderTypes);
  return Math.floor((maxHp * eff) / 8);
};

// 압정 진입 데미지(최대 HP 비율). 층수별 1/8·1/6·1/4. 비행 타입은 무효(0).
export const spikesDamage = (defenderTypes: ReadonlyArray<TypeName>, maxHp: number, layers: 1 | 2 | 3): number => {
  if (defenderTypes.includes('비행')) {
    return 0;
  }
  const fraction = layers === 1 ? 8 : layers === 2 ? 6 : 4;
  return Math.floor(maxHp / fraction);
};
