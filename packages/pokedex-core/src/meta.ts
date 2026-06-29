import { z } from 'zod';

export const UsageEntry = z.object({
  rank: z.number().int().min(1),
  species: z.string(),
  usage_rate: z.number().min(0).max(100),
  trend: z.enum(['up', 'down', 'stable']).optional(),
});

export const UsageMeta = z.object({
  season: z.string(),
  captured_at: z.string().optional(),
  source: z.string(),
  entries: z.array(UsageEntry),
});
export type UsageMeta = z.infer<typeof UsageMeta>;

export const RoleTags = z.record(z.string(), z.array(z.string()));
export type RoleTags = z.infer<typeof RoleTags>;

export const MetaBundle = z.object({
  season: z.string(),
  usage: UsageMeta.optional(),
  roleTags: RoleTags.optional(),
});
export type MetaBundle = z.infer<typeof MetaBundle>;

export const currentMeta = null as MetaBundle | null;

export const usageRankOf = (species: string): number | undefined =>
  currentMeta?.usage?.entries.find((entry) => entry.species === species)?.rank;

export const roleTagsOf = (species: string): string[] | undefined => currentMeta?.roleTags?.[species];

export const metaSummary = (): string | null => {
  if (!currentMeta) {
    return null;
  }
  const usageNote = currentMeta.usage ? ` (사용률 Top ${currentMeta.usage.entries.length})` : '';
  return `메타 시즌 ${currentMeta.season}${usageNote}`;
};
