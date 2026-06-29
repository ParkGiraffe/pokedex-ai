import { findPokemon, formula, type NatureName, type TeraType, type TypeName } from '@pokedex-agent/pokedex-core';

export const EV_MIN = 0;
export const EV_MAX = 32;

type Category = '물리' | '특수';

type AttackShape = {
  level: number;
  category: Category;
  moveType: TypeName;
  movePower: number;
  itemMultiplier: number;
  terastalized: boolean;
  teraType: TeraType;
};

const attackStatOf = (
  species: string,
  ev: number,
  level: number,
  nature: NatureName,
  category: Category,
): number | undefined => {
  const entry = findPokemon(species);
  if (!entry) {
    return undefined;
  }
  const key = category === '물리' ? 'A' : 'C';
  return formula.actualStat({ stat: key, base: entry.base[key], iv: 31, ev, level, nature });
};

export type BulkInput = {
  defenderSpecies: string;
  defenderLevel: number;
  defenderNature: NatureName;
  attackerSpecies: string;
  attackerLevel: number;
  attackerNature: NatureName;
  attackerEv: number;
  attack: AttackShape;
  hits: number;
};

export type BulkSpread = {
  hpEv: number;
  defEv: number;
  total: number;
  hp: number;
  defense: number;
  maxDamage: number;
  takenPercent: number;
};

export type BulkResult = {
  best?: BulkSpread;
  hpHeavy?: BulkSpread;
  defHeavy?: BulkSpread;
  canSurvive: boolean;
};

export const optimizeBulk = (input: BulkInput): BulkResult | undefined => {
  const defender = findPokemon(input.defenderSpecies);
  const attacker = findPokemon(input.attackerSpecies);
  if (!defender || !attacker) {
    return undefined;
  }
  const attack = attackStatOf(
    input.attackerSpecies,
    input.attackerEv,
    input.attackerLevel,
    input.attackerNature,
    input.attack.category,
  );
  if (attack === undefined) {
    return undefined;
  }
  const defenseKey = input.attack.category === '물리' ? 'B' : 'D';
  const hits = Math.max(1, input.hits);

  const survivable: BulkSpread[] = [];
  for (let hpEv = EV_MIN; hpEv <= EV_MAX; hpEv += 1) {
    const hp = formula.actualStat({
      stat: 'H',
      base: defender.base.H,
      iv: 31,
      ev: hpEv,
      level: input.defenderLevel,
      nature: input.defenderNature,
    });
    for (let defEv = EV_MIN; defEv <= EV_MAX; defEv += 1) {
      const defense = formula.actualStat({
        stat: defenseKey,
        base: defender.base[defenseKey],
        iv: 31,
        ev: defEv,
        level: input.defenderLevel,
        nature: input.defenderNature,
      });
      const damage = formula.calculateDamage({
        level: input.attack.level,
        attack,
        defense,
        basePower: input.attack.movePower,
        category: input.attack.category,
        attackerTypes: attacker.types,
        defenderTypes: defender.types,
        moveType: input.attack.moveType,
        attackerTeraType: input.attack.terastalized ? input.attack.teraType : undefined,
        attackerTerastalized: input.attack.terastalized,
        itemMultiplier: input.attack.itemMultiplier,
      });
      if (damage.max * hits < hp) {
        survivable.push({
          hpEv,
          defEv,
          total: hpEv + defEv,
          hp,
          defense,
          maxDamage: damage.max,
          takenPercent: (damage.max / hp) * 100,
        });
      }
    }
  }

  if (survivable.length === 0) {
    return { canSurvive: false };
  }

  const byTotal = [...survivable].sort(
    (a, b) => a.total - b.total || Math.abs(a.hpEv - a.defEv) - Math.abs(b.hpEv - b.defEv),
  );
  const hpHeavy = [...survivable].sort((a, b) => b.hpEv - a.hpEv || a.total - b.total)[0];
  const defHeavy = [...survivable].sort((a, b) => b.defEv - a.defEv || a.total - b.total)[0];
  return { best: byTotal[0], hpHeavy, defHeavy, canSurvive: true };
};

export type SpeedReverseInput = {
  species: string;
  level: number;
  nature: NatureName;
  itemMultiplier: number;
  abilityMultiplier: number;
  targetSpeed: number;
};

export type SpeedReverseResult = {
  evNeeded: number | null;
  achievedSpeed: number;
  maxSpeed: number;
};

const effectiveSpeedAt = (
  species: string,
  ev: number,
  input: Pick<SpeedReverseInput, 'level' | 'nature' | 'itemMultiplier' | 'abilityMultiplier'>,
): number | undefined => {
  const entry = findPokemon(species);
  if (!entry) {
    return undefined;
  }
  const base = formula.actualStat({
    stat: 'S',
    base: entry.base.S,
    iv: 31,
    ev,
    level: input.level,
    nature: input.nature,
  });
  return formula.effectiveSpeed({
    base,
    itemMultiplier: input.itemMultiplier,
    abilityMultiplier: input.abilityMultiplier,
  });
};

export const optimizeSpeed = (input: SpeedReverseInput): SpeedReverseResult | undefined => {
  const maxSpeed = effectiveSpeedAt(input.species, EV_MAX, input);
  if (maxSpeed === undefined) {
    return undefined;
  }
  for (let ev = EV_MIN; ev <= EV_MAX; ev += 1) {
    const speed = effectiveSpeedAt(input.species, ev, input);
    if (speed !== undefined && speed > input.targetSpeed) {
      return { evNeeded: ev, achievedSpeed: speed, maxSpeed };
    }
  }
  return { evNeeded: null, achievedSpeed: maxSpeed, maxSpeed };
};

export const assumedSpeed = (species: string, level: number, nature: NatureName, ev = EV_MAX): number | undefined =>
  effectiveSpeedAt(species, ev, { level, nature, itemMultiplier: 1, abilityMultiplier: 1 });

export type PowerInput = {
  attackerSpecies: string;
  attackerLevel: number;
  attackerNature: NatureName;
  attack: AttackShape;
  defenderSpecies: string;
  defenderLevel: number;
  defenderNature: NatureName;
  defenderHpEv: number;
  defenderDefEv: number;
  targetHits: number;
  guaranteed: boolean;
};

export type PowerResult = {
  evNeeded: number | null;
  achievedHitsText: string;
  maxDamagePercent: number;
};

export const optimizePower = (input: PowerInput): PowerResult | undefined => {
  const attacker = findPokemon(input.attackerSpecies);
  const defender = findPokemon(input.defenderSpecies);
  if (!attacker || !defender) {
    return undefined;
  }
  const defenseKey = input.attack.category === '물리' ? 'B' : 'D';
  const hp = formula.actualStat({
    stat: 'H',
    base: defender.base.H,
    iv: 31,
    ev: input.defenderHpEv,
    level: input.defenderLevel,
    nature: input.defenderNature,
  });
  const defense = formula.actualStat({
    stat: defenseKey,
    base: defender.base[defenseKey],
    iv: 31,
    ev: input.defenderDefEv,
    level: input.defenderLevel,
    nature: input.defenderNature,
  });

  const damageAt = (ev: number): formula.DamageResult | undefined => {
    const attack = attackStatOf(
      input.attackerSpecies,
      ev,
      input.attackerLevel,
      input.attackerNature,
      input.attack.category,
    );
    if (attack === undefined) {
      return undefined;
    }
    return formula.calculateDamage({
      level: input.attack.level,
      attack,
      defense,
      basePower: input.attack.movePower,
      category: input.attack.category,
      attackerTypes: attacker.types,
      defenderTypes: defender.types,
      moveType: input.attack.moveType,
      attackerTeraType: input.attack.terastalized ? input.attack.teraType : undefined,
      attackerTerastalized: input.attack.terastalized,
      itemMultiplier: input.attack.itemMultiplier,
    });
  };

  const hitsMet = (damage: formula.DamageResult): boolean => {
    const roll = input.guaranteed ? damage.min : damage.max;
    if (roll <= 0) {
      return false;
    }
    return Math.ceil(hp / roll) <= input.targetHits;
  };

  const hitsTextOf = (damage: formula.DamageResult): string => {
    const guaranteedHits = damage.min > 0 ? Math.ceil(hp / damage.min) : Number.POSITIVE_INFINITY;
    const possibleHits = damage.max > 0 ? Math.ceil(hp / damage.max) : Number.POSITIVE_INFINITY;
    if (!Number.isFinite(guaranteedHits)) {
      return '데미지 없음';
    }
    return guaranteedHits === possibleHits ? `확정 ${guaranteedHits}타` : `난수 ${possibleHits}타`;
  };

  const maxDamage = damageAt(EV_MAX);
  if (!maxDamage) {
    return undefined;
  }
  for (let ev = EV_MIN; ev <= EV_MAX; ev += 1) {
    const damage = damageAt(ev);
    if (damage && hitsMet(damage)) {
      return { evNeeded: ev, achievedHitsText: hitsTextOf(damage), maxDamagePercent: (damage.max / hp) * 100 };
    }
  }
  return { evNeeded: null, achievedHitsText: hitsTextOf(maxDamage), maxDamagePercent: (maxDamage.max / hp) * 100 };
};
