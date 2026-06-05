import { findPokemon, formula, type TypeName } from '@pokedex-agent/pokedex-core';

import { type AttackerInput, type DefenderInput } from '../model/store';

export type CalcResult = {
  damage: formula.DamageResult;
  defenderHp: number;
  attackStat: number;
  defenseStat: number;
  minPercent: number;
  maxPercent: number;
  // 최소 데미지(=최악의 롤) 기준 N타 KO. min=0이면 ∞.
  guaranteedHits: number;
  // 최대 데미지(=가장 운 좋은 롤) 기준 N타 KO. max=0이면 ∞.
  possibleHits: number;
  // 한국 SV 표기: guaranteed === possible이면 "확정 N타", 다르면 "난수 N타" 단일 형식.
  hitsText: string;
  attackerTypes: readonly TypeName[];
  defenderTypes: readonly TypeName[];
};

export const computeCalc = (attacker: AttackerInput, defender: DefenderInput): CalcResult | undefined => {
  const attackerEntry = findPokemon(attacker.species);
  const defenderEntry = findPokemon(defender.species);
  if (!attackerEntry || !defenderEntry) {
    return undefined;
  }

  const attackKey = attacker.category === '물리' ? 'A' : 'C';
  const rawAttack = formula.actualStat({
    stat: attackKey,
    base: attackerEntry.base[attackKey],
    iv: 31,
    ev: attacker.ev,
    level: attacker.level,
    nature: attacker.nature,
  });
  const attackStat = formula.applyRank(rawAttack, attacker.rank);

  const defenseKey = attacker.category === '물리' ? 'B' : 'D';
  const rawDefense = formula.actualStat({
    stat: defenseKey,
    base: defenderEntry.base[defenseKey],
    iv: 31,
    ev: defender.defEv,
    level: defender.level,
    nature: defender.nature,
  });
  const defenseStat = formula.applyRank(rawDefense, defender.rank);

  const defenderHp = formula.actualStat({
    stat: 'H',
    base: defenderEntry.base.H,
    iv: 31,
    ev: defender.hpEv,
    level: defender.level,
    nature: defender.nature,
  });

  const damage = formula.calculateDamage({
    level: attacker.level,
    attack: attackStat,
    defense: defenseStat,
    basePower: attacker.movePower,
    category: attacker.category,
    attackerTypes: attackerEntry.types,
    defenderTypes: defenderEntry.types,
    moveType: attacker.moveType,
    attackerTeraType: attacker.terastalized ? attacker.teraType : undefined,
    attackerTerastalized: attacker.terastalized,
    critical: attacker.critical,
    weatherBoost: attacker.weatherBoost,
    itemMultiplier: attacker.itemMultiplier,
    burned: attacker.burned,
  });

  const guaranteedHits = damage.min > 0 ? Math.ceil(defenderHp / damage.min) : Number.POSITIVE_INFINITY;
  const possibleHits = damage.max > 0 ? Math.ceil(defenderHp / damage.max) : Number.POSITIVE_INFINITY;
  const hitsText = !Number.isFinite(guaranteedHits)
    ? ''
    : guaranteedHits === possibleHits
      ? `확정 ${guaranteedHits}타`
      : `난수 ${possibleHits}타`;

  return {
    damage,
    defenderHp,
    attackStat,
    defenseStat,
    minPercent: (damage.min / defenderHp) * 100,
    maxPercent: (damage.max / defenderHp) * 100,
    guaranteedHits,
    possibleHits,
    hitsText,
    attackerTypes: attackerEntry.types,
    defenderTypes: defenderEntry.types,
  };
};
