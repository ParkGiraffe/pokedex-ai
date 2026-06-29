export const BATTLE_GIMMICKS = ['none', 'mega', 'tera'] as const;
export type BattleGimmick = (typeof BATTLE_GIMMICKS)[number];

export const BATTLE_RESULTS = ['win', 'loss'] as const;
export type BattleResult = (typeof BATTLE_RESULTS)[number];
