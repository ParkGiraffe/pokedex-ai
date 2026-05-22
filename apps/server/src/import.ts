import { findItem, findMove, findPokemon } from "@pokedex-agent/pokedex-core";

// 로컬 비전 모델(Ollama) 설정. 기본 Qwen2.5-VL. 키·과금 없이 로컬에서 동작.
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5vl:7b";

const PROMPT = [
  "이 이미지는 포켓몬 챔피언스 팀 화면이다. 6마리 각각의 정보를 추출해 JSON으로만 답하라.",
  '형식: {"party":[{"species":"한국어 종족명","ability":"한국어 특성","item":"한국어 도구","nature":"한국어 성격","moves":["기술1","기술2","기술3","기술4"],"points":{"H":0,"A":0,"B":0,"C":0,"D":0,"S":0}}]}',
  "- 모든 이름은 화면에 적힌 한국어 그대로 옮긴다. 추측하지 말고, 안 보이면 빈 문자열로 둔다.",
  "- points는 능력치 노력 포인트 0~32 (H=HP, A=공격, B=방어, C=특수공격, D=특수방어, S=스피드).",
].join("\n");

type Points = Partial<Record<"H" | "A" | "B" | "C" | "D" | "S", number>>;
export type RawMember = {
  species?: string;
  ability?: string;
  item?: string;
  nature?: string;
  moves?: string[];
  points?: Points;
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

const STAT_KEYS = ["H", "A", "B", "C", "D", "S"] as const;

// 챔피언스 0~32 포인트(합 66 = 508EV) → SV EV(0~252).
const toEv = (point: unknown): number => {
  const value = Number(point);
  return Number.isFinite(value) ? Math.min(252, Math.max(0, Math.round((value * 508) / 66))) : 0;
};

// 추출 결과를 우리 데이터로 검증하고(고유명사 추측 금지) 빌더 형식으로 변환한다.
export const buildImportResult = (raw: RawMember[]): ImportResult => {
  const warnings: string[] = [];
  const party = raw.slice(0, 6).map((member, index): ImportMember => {
    const slot = index + 1;
    const species = (member.species ?? "").trim();
    if (!species) {
      warnings.push(`${slot}번 슬롯 종족을 못 읽음`);
    } else if (!findPokemon(species)) {
      warnings.push(`${slot}번 종족 미확인: ${species}`);
    }

    const moves = (member.moves ?? []).map((move) => String(move ?? "").trim()).filter(Boolean);
    for (const move of moves) {
      if (!findMove(move)) {
        warnings.push(`${slot}번 기술 미확인: ${move}`);
      }
    }

    const item = (member.item ?? "").trim();
    if (item && !findItem(item)) {
      warnings.push(`${slot}번 도구 미확인(챔피언스 신규 메가일 수 있음): ${item}`);
    }

    const evs = { H: 0, A: 0, B: 0, C: 0, D: 0, S: 0 };
    for (const key of STAT_KEYS) {
      evs[key] = toEv(member.points?.[key]);
    }

    return {
      species,
      ability: (member.ability ?? "").trim(),
      item,
      nature: (member.nature ?? "노력").trim() || "노력",
      teraType: "노말",
      moves: [moves[0] ?? "", moves[1] ?? "", moves[2] ?? "", moves[3] ?? ""],
      evs,
    };
  });
  return { party, warnings };
};

export const extractPartyFromImage = async (base64: string): Promise<RawMember[]> => {
  let response: Response;
  try {
    response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        format: "json",
        stream: false,
        messages: [{ role: "user", content: PROMPT, images: [base64] }],
      }),
    });
  } catch {
    throw new Error(`로컬 비전 서버(Ollama)에 연결 못 함 — ollama 실행 + '${OLLAMA_MODEL}' pull 확인`);
  }
  if (!response.ok) {
    throw new Error(`Ollama 오류 ${response.status} (모델 '${OLLAMA_MODEL}' 확인)`);
  }
  const data = (await response.json()) as { message?: { content?: string } };
  const content = data.message?.content ?? "[]";
  const parsed = JSON.parse(content) as unknown;
  if (Array.isArray(parsed)) {
    return parsed as RawMember[];
  }
  return ((parsed as { party?: RawMember[] }).party ?? []) as RawMember[];
};
