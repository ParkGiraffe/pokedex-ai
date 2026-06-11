// 기믹·승패는 문자열 리터럴 유니온으로 둔다(User.provider와 같은 @Enum items 패턴, Zod z.enum과 공유).
export const BATTLE_GIMMICKS = ['none', 'mega', 'tera'] as const;
export type BattleGimmick = (typeof BATTLE_GIMMICKS)[number];

export const BATTLE_RESULTS = ['win', 'loss'] as const;
export type BattleResult = (typeof BATTLE_RESULTS)[number];
