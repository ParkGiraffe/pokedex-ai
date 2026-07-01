import { PartyDraft } from '@pokedex-agent/pokedex-core';
import { z } from 'zod';

export const CreatePresetBody = z.object({
  name: z.string().min(1).max(50),
  party: PartyDraft,
});
export type CreatePresetInput = z.infer<typeof CreatePresetBody>;
