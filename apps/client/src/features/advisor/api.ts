import type { BattleState, ClaudeResponse, Party } from "@pokedex-agent/pokedex-core";

// 어드바이저 서버(apps/server) 호출. dev에서는 Vite 프록시(/advisor)를 통해 같은 출처로 보낸다.
const BASE = "/advisor";

const postJson = async <T>(path: string, body: unknown, fallback: string): Promise<T> => {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `${fallback} (${response.status})`);
  }
  return response.json() as Promise<T>;
};

// 추천 시스템: 서버가 Anthropic API를 호출해 ClaudeResponse를 반환.
export const requestPartyAnalysis = (party: Party): Promise<ClaudeResponse> =>
  postJson("/analyze-party", { party }, "파티 분석 실패");

export type MegaFormSelection = {
  my?: Record<string, string>;
  opponent?: Record<string, string>;
};

export const requestMatchupLeadrec = (
  state: BattleState,
  megaForms?: MegaFormSelection
): Promise<ClaudeResponse> => postJson("/matchup-leadrec", { state, megaForms }, "매치업 분석 실패");

export const requestBattleAdvice = (state: BattleState): Promise<ClaudeResponse> =>
  postJson("/battle-advice", { state }, "배틀 추천 실패");

export type ImportMember = {
  species: string;
  ability: string;
  item: string;
  nature: string;
  teraType: string;
  moves: [string, string, string, string];
  evs: Record<"H" | "A" | "B" | "C" | "D" | "S", number>;
};

export type ImportResult = { party: ImportMember[]; warnings: string[] };

// 파티 화면 이미지 여러 장(base64 data URL) → 서버 비전 분석·병합 → 검증된 파티
export const importPartyImages = async (images: string[]): Promise<ImportResult> => {
  const response = await fetch(`${BASE}/import-party`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images }),
  });
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `이미지 분석 실패 (${response.status})`);
  }
  return response.json() as Promise<ImportResult>;
};
