import { z } from 'zod';

import { BATTLE_GIMMICKS, BATTLE_RESULTS } from './battle-log.enums';

export const CreateBattleLogBody = z.object({
  myLead: z.string().min(1).max(50),
  opponentLead: z.string().min(1).max(50),
  gimmick: z.enum(BATTLE_GIMMICKS),
  result: z.enum(BATTLE_RESULTS),
  memo: z.string().max(300).optional(),
  // ISO 문자열만 받는다(미지정 시 서버가 등록 시각으로 채움).
  playedAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), '유효한 날짜가 아닙니다')
    .optional(),
});
export type CreateBattleLogInput = z.infer<typeof CreateBattleLogBody>;
