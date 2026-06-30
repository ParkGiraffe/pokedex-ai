export const BATTLE_GIMMICKS = ['none', 'mega', 'tera'] as const;
export type BattleGimmick = (typeof BATTLE_GIMMICKS)[number];
