import { findPokemon, formula, type NatureName, type TeraType, type TypeName } from '@pokedex-agent/pokedex-core';

// 챔피언스 노력 포인트는 스탯당 0~32. 역산은 목표(생존·추월·KO)를 만족하는 최소 포인트를 찾는다.
export const EV_MIN = 0;
export const EV_MAX = 32;

type Category = '물리' | '특수';

// 한 방 데미지 계산(공격측 실수치는 호출 측에서 미리 만든다)에 필요한 고정 입력.
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

// ---------- 모드 1: 내구 역산 (특정 공격을 확정으로 버티는 최소 HP/방어 노력) ----------
export type BulkInput = {
  defenderSpecies: string;
  defenderLevel: number;
  defenderNature: NatureName;
  attackerSpecies: string;
  attackerLevel: number;
  attackerNature: NatureName;
  attackerEv: number;
  attack: AttackShape;
  hits: number; // 몇 번의 공격을 버틸지 (1 = 단발 확정 생존)
};

export type BulkSpread = {
  hpEv: number;
  defEv: number;
  total: number;
  hp: number;
  defense: number;
  maxDamage: number;
  // 최대 롤 기준 받는 데미지 비율(%). 100 미만이면 단발 확정 생존.
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
      // 누적 최대 데미지가 HP 미만이면 hits번 버틴다.
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

  // 최소 총 포인트(동률이면 더 균형 잡힌 쪽), HP 몰빵 최소, 방어 몰빵 최소.
  const byTotal = [...survivable].sort(
    (a, b) => a.total - b.total || Math.abs(a.hpEv - a.defEv) - Math.abs(b.hpEv - b.defEv),
  );
  const hpHeavy = [...survivable].sort((a, b) => b.hpEv - a.hpEv || a.total - b.total)[0];
  const defHeavy = [...survivable].sort((a, b) => b.defEv - a.defEv || a.total - b.total)[0];
  return { best: byTotal[0], hpHeavy, defHeavy, canSurvive: true };
};

// ---------- 모드 2: 스피드 역산 (목표 스피드를 추월하는 최소 스피드 노력) ----------
export type SpeedReverseInput = {
  species: string;
  level: number;
  nature: NatureName;
  itemMultiplier: number; // 구애스카프 1.5 등
  abilityMultiplier: number; // 가속 1.5 등
  targetSpeed: number; // 추월하려는 상대 실효 스피드
};

export type SpeedReverseResult = {
  evNeeded: number | null; // null이면 최대 투자로도 추월 불가
  achievedSpeed: number; // 최소 투자(또는 32)에서의 내 실효 스피드
  maxSpeed: number; // 32 투자 시 실효 스피드
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

// 상대 종족의 실효 스피드(목표 스피드 채우기 보조). 기본 최대 투자 가정.
export const assumedSpeed = (species: string, level: number, nature: NatureName, ev = EV_MAX): number | undefined =>
  effectiveSpeedAt(species, ev, { level, nature, itemMultiplier: 1, abilityMultiplier: 1 });

// ---------- 모드 3: 화력 역산 (목표 N타 KO를 내는 최소 공격 노력) ----------
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
  targetHits: number; // 목표 N타 (1 = 1타)
  guaranteed: boolean; // true=확정(최악 롤), false=난수(최선 롤)
};

export type PowerResult = {
  evNeeded: number | null; // null이면 최대 투자로도 목표 N타 불가
  achievedHitsText: string; // 최소 투자(또는 32)에서의 N타 표기
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

  // 확정 N타 = 최악 롤(min) 기준 ceil(HP/min) ≤ N. 난수 N타 = 최선 롤(max) 기준.
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
