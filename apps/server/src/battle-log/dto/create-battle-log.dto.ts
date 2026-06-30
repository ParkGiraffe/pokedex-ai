import { z } from 'zod';

import { BATTLE_GIMMICKS, BATTLE_RESULTS } from '../enums';

export const CreateBattleLogBody = z.object({
  myLead: z.string().min(1).max(50),
  opponentLead: z.string().min(1).max(50),
  gimmick: z.enum(BATTLE_GIMMICKS),
  result: z.enum(BATTLE_RESULTS),
  memo: z.string().max(300).optional(),
  playedAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), '유효한 날짜가 아닙니다')
    .optional(),
});
export type CreateBattleLogInput = z.infer<typeof CreateBattleLogBody>;
