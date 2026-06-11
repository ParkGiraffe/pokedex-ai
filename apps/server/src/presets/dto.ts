import { PartyDraft } from '@pokedex-agent/pokedex-core';
import { z } from 'zod';

export const CopyPresetBody = z.object({
  token: z.string().min(1),
});
export type CopyPresetInput = z.infer<typeof CopyPresetBody>;

// party는 검증된 Party가 아니라 빌더 작업 상태(PartyDraft) — 부분 입력도 그대로 저장한다.
export const CreatePresetBody = z.object({
  name: z.string().min(1).max(50),
  party: PartyDraft,
});
export type CreatePresetInput = z.infer<typeof CreatePresetBody>;

export const UpdatePresetBody = z
  .object({
    name: z.string().min(1).max(50).optional(),
    party: PartyDraft.optional(),
  })
  .refine((body) => body.name !== undefined || body.party !== undefined, {
    message: '변경할 내용이 없습니다',
  });
export type UpdatePresetInput = z.infer<typeof UpdatePresetBody>;
