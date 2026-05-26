import { findPokemon, formula, type TypeName } from "@pokedex-agent/pokedex-core";

import { type AttackerInput, type DefenderInput } from "../model/store";

const rankMultiplier = (rank: number): number => (rank >= 0 ? (2 + rank) / 2 : 2 / (2 - rank));

const applyRank = (stat: number, rank: number): number => Math.floor(stat * rankMultiplier(rank));

export type CalcResult = {
  damage: formula.DamageResult;
  defenderHp: number;
  attackStat: number;
  defenseStat: number;
  minPercent: number;
  maxPercent: number;
  guaranteedHits: number;
  attackerTypes: readonly TypeName[];
  defenderTypes: readonly TypeName[];
};

export const computeCalc = (
  attacker: AttackerInput,
  defender: DefenderInput
): CalcResult | undefined => {
  const attackerEntry = findPokemon(attacker.species);
  const defenderEntry = findPokemon(defender.species);
  if (!attackerEntry || !defenderEntry) {
    return undefined;
  }

  const attackKey = attacker.category === "물리" ? "A" : "C";
  const rawAttack = formula.actualStat({
    stat: attackKey,
    base: attackerEntry.base[attackKey],
    iv: 31,
    ev: attacker.ev,
    level: attacker.level,
    nature: attacker.nature,
  });
  const attackStat = applyRank(rawAttack, attacker.rank);

  const defenseKey = attacker.category === "물리" ? "B" : "D";
  const rawDefense = formula.actualStat({
    stat: defenseKey,
    base: defenderEntry.base[defenseKey],
    iv: 31,
    ev: defender.defEv,
    level: defender.level,
    nature: defender.nature,
  });
  const defenseStat = applyRank(rawDefense, defender.rank);

  const defenderHp = formula.actualStat({
    stat: "H",
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

  return {
    damage,
    defenderHp,
    attackStat,
    defenseStat,
    minPercent: (damage.min / defenderHp) * 100,
    maxPercent: (damage.max / defenderHp) * 100,
    guaranteedHits: damage.min > 0 ? Math.ceil(defenderHp / damage.min) : Number.POSITIVE_INFINITY,
    attackerTypes: attackerEntry.types,
    defenderTypes: defenderEntry.types,
  };
};

