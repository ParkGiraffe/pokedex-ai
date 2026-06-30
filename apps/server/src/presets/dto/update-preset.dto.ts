import { PartyDraft } from '@pokedex-agent/pokedex-core';
import { z } from 'zod';

export const UpdatePresetBody = z
  .object({
    name: z.string().min(1).max(50).optional(),
    party: PartyDraft.optional(),
  })
  .refine((body) => body.name !== undefined || body.party !== undefined, {
    message: '변경할 내용이 없습니다',
  });
export type UpdatePresetInput = z.infer<typeof UpdatePresetBody>;
