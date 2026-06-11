import { findMegasBySpecies, findPokemon, formula } from '@pokedex-agent/pokedex-core';

import { type SpeedSide } from '../model/store';

export const computeSpeed = (side: SpeedSide): number | undefined => {
  const entry = findPokemon(side.species);
  if (!entry) {
    return undefined;
  }
  // 메가 폼이 선택돼 있으면 메가 base.S로 계산한다.
  const mega = side.megaForm ? findMegasBySpecies(side.species).find((m) => m.form === side.megaForm) : undefined;
  const baseSpeed = mega ? mega.base.S : entry.base.S;
  const raw = formula.actualStat({
    stat: 'S',
    base: baseSpeed,
    iv: 31,
    ev: side.ev,
    level: side.level,
    nature: side.nature,
  });
  return formula.effectiveSpeed({
    base: raw,
    rank: side.rank,
    tailwind: side.tailwind,
    paralyzed: side.paralyzed,
    stickyWeb: side.stickyWeb,
    itemMultiplier: side.itemMultiplier,
    abilityMultiplier: side.abilityMultiplier,
  });
};

export type SpeedComparison = {
  left: number;
  right: number;
  faster: formula.FasterResult;
};

export const compareSpeed = (left: SpeedSide, right: SpeedSide, trickRoom: boolean): SpeedComparison | undefined => {
  const leftSpeed = computeSpeed(left);
  const rightSpeed = computeSpeed(right);
  if (leftSpeed === undefined || rightSpeed === undefined) {
    return undefined;
  }
  return {
    left: leftSpeed,
    right: rightSpeed,
    faster: formula.fasterSide({ left: leftSpeed, right: rightSpeed }, { trickRoom }),
  };
};
