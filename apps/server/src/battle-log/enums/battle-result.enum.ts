export const BATTLE_RESULTS = ['win', 'loss'] as const;
export type BattleResult = (typeof BATTLE_RESULTS)[number];
