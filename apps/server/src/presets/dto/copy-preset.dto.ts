import { z } from 'zod';

export const CopyPresetBody = z.object({
  token: z.string().min(1),
});
export type CopyPresetInput = z.infer<typeof CopyPresetBody>;
