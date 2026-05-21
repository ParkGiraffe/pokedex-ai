import { z } from "zod";

export const ClaudeResponseSchema = z.object({
  task: z.enum(["party-analysis", "matchup-leadrec", "battle-decision"]),
  summary: z.string(),
  details: z.array(
    z.object({
      kind: z.enum(["strength", "weakness", "warning", "recommendation"]),
      target: z.string(),
      text: z.string(),
      evidence: z.record(z.string(), z.unknown()).default({}),
    })
  ),
  actionable: z
    .array(
      z.object({
        kind: z.enum(["swap-slot", "change-tera", "change-move", "change-item"]),
        slot: z.number().int().min(1).max(6).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        reason: z.string(),
      })
    )
    .default([]),
  unknownNames: z.array(z.string()).default([]),
});
export type ClaudeResponse = z.infer<typeof ClaudeResponseSchema>;

const JSON_FENCE = /```json\s*\n([\s\S]+?)\n```/i;

export type ParseResult =
  | { success: true; data: ClaudeResponse }
  | { success: false; reason: string; raw: string | null };

export const parseClaudeResponse = (text: string): ParseResult => {
  const match = text.match(JSON_FENCE);
  if (!match) return { success: false, reason: "JSON 코드블록 없음", raw: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1]!);
  } catch (e) {
    return { success: false, reason: `JSON 파싱 실패: ${String(e)}`, raw: match[1] ?? null };
  }

  const result = ClaudeResponseSchema.safeParse(parsed);
  if (!result.success) {
    return { success: false, reason: `스키마 미스: ${result.error.message}`, raw: match[1] ?? null };
  }
  return { success: true, data: result.data };
};
