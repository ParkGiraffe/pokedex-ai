// 어드바이저 서버(apps/server) 호출. dev에서는 Vite 프록시(/advisor)를 통해 같은 출처로 보낸다.
const BASE = "/advisor";

export type AdviceMon = {
  species: string;
  moves: string[];
  level?: number;
  item?: string;
  ability?: string;
  nature?: string;
  evs?: Partial<Record<"hp" | "atk" | "def" | "spa" | "spd" | "spe", number>>;
  mega?: boolean;
  megaForme?: "X" | "Y";
};

export type MoveOption = {
  move: string;
  min: number;
  max: number;
  koChance: number;
  koText: string;
  desc: string;
};

export type SwitchOption = { pick: string; matchup: { verdict: string; faster: string } };

export type DecideResult = {
  moveOptions: MoveOption[];
  switchOptions: SwitchOption[];
  recommendation: string;
  summary: string;
};

export type DecideBody = { active: AdviceMon; opponentSpecies: string; bench: AdviceMon[] };

export const requestDecision = async (body: DecideBody): Promise<DecideResult> => {
  const response = await fetch(`${BASE}/decide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`어드바이저 서버 오류 (${response.status})`);
  }
  return response.json() as Promise<DecideResult>;
};

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
