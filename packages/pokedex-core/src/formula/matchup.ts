import typesRaw from '../../data/types.json' with { type: 'json' };
import type { TypeName } from '../types';

type TypesFile = {
  matchup: Record<string, Record<string, number>>;
};

const matchup = (typesRaw as TypesFile).matchup;

export const typeEffectiveness = (attackType: TypeName, defenderTypes: ReadonlyArray<TypeName>): number => {
  let result = 1;
  for (const defender of defenderTypes) {
    const v = matchup[attackType]?.[defender];
    if (v === undefined) {
      throw new Error(`알 수 없는 타입 조합: ${attackType} vs ${defender}`);
    }
    result *= v;
  }
  return result;
};
