import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// 로컬 비전 모델(Ollama). 기본 qwen2.5vl:7b (thinking 없어 JSON 깔끔, 빠름).
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5vl:7b";
const CORE = resolve(import.meta.dirname, "../../../packages/pokedex-core/data");

const PROMPT = [
  "포켓몬 챔피언스 팀 화면 이미지다. 6마리가 있고 각 카드는 좌우 2열이다.",
  "왼쪽 열(위→아래): 종족 이름 → 특성 → 도구. 오른쪽 열: 기술 4개.",
  "능력치 화면이면 H/A/B/C/D/S 옆 작은 숫자가 노력 포인트(0~32)다.",
  '오직 JSON만 출력: {"party":[{"species":"종족명","ability":"특성","item":"도구","nature":"성격","moves":["기술1","기술2","기술3","기술4"],"points":{"H":0,"A":0,"B":0,"C":0,"D":0,"S":0}}]}',
  "- 각 포켓몬마다 기술 4개와 도구를 반드시 모두 포함하라(도구와 기술을 헷갈려도 됨 — 보이는 텍스트를 빠짐없이 채워라).",
  "- 화면의 한국어 그대로 옮긴다. 안 보이면 빈 문자열(숫자는 0).",
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

const toEv = (point: unknown): number => {
  const value = Number(point);
  return Number.isFinite(value) ? Math.min(252, Math.max(0, Math.round((value * 508) / 66))) : 0;
};

// --- 우리 데이터 사전 (OCR 오독 교정 + 도구/기술 재분류용) ---
const norm = (value: string): string => value.toLowerCase().replace(/\s/g, "");
const readKo = (file: string, key: string, prop = "ko"): string[] => {
  const parsed = JSON.parse(readFileSync(resolve(CORE, file), "utf8")) as Record<string, Array<Record<string, string>>>;
  return (parsed[key] ?? []).map((row) => row[prop]).filter((value): value is string => Boolean(value));
};

const SPECIES = readKo("pokedex.json", "entries");
const MOVES = readKo("moves.json", "moves");
const ITEMS = [...readKo("items.json", "items"), ...readKo("champions/items.json", "items")];
const ABILITIES = readKo("abilities.json", "abilities");

const distance = (a: string, b: string): number => {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) {
    rows[0]![j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i]![j] = Math.min(rows[i - 1]![j]! + 1, rows[i]![j - 1]! + 1, rows[i - 1]![j - 1]! + cost);
    }
  }
  return rows[a.length]![b.length]!;
};

// 사전에서 가장 가까운 한국어명. dist가 임계 이하일 때만 채택(OCR 오타 1~2자 교정).
const nearest = (text: string, dict: string[]): { name: string; dist: number } | undefined => {
  const target = norm(text);
  if (!target) {
    return undefined;
  }
  let best: { name: string; dist: number } | undefined;
  for (const candidate of dict) {
    const dist = distance(target, norm(candidate));
    if (!best || dist < best.dist) {
      best = { name: candidate, dist };
    }
    if (dist === 0) {
      break;
    }
  }
  const limit = Math.max(1, Math.floor(target.length / 3));
  return best && best.dist <= limit ? best : undefined;
};

// 모델이 도구/기술 칸을 헷갈리므로, item+moves 텍스트를 한 풀로 모아 사전으로 재분류한다.
const classify = (raw: RawMember): { item: string; moves: string[]; unmatched: string[] } => {
  const texts = [raw.item, ...(raw.moves ?? [])].map((value) => String(value ?? "").trim()).filter(Boolean);
  let item = "";
  const moves: string[] = [];
  const unmatched: string[] = [];
  for (const text of texts) {
    const asMove = nearest(text, MOVES);
    const asItem = nearest(text, ITEMS);
    if (asItem && (!asMove || asItem.dist < asMove.dist) && !item) {
      item = asItem.name;
    } else if (asMove) {
      moves.push(asMove.name);
    } else if (asItem && !item) {
      item = asItem.name;
    } else {
      unmatched.push(text);
    }
  }
  return { item, moves, unmatched };
};

export const buildImportResult = (raw: RawMember[]): ImportResult => {
  const warnings: string[] = [];
  const party = raw.slice(0, 6).map((member, index): ImportMember => {
    const slot = index + 1;
    const rawSpecies = (member.species ?? "").trim();
    const species = nearest(rawSpecies, SPECIES)?.name ?? rawSpecies;
    if (!species) {
      warnings.push(`${slot}번 종족을 못 읽음`);
    } else if (norm(species) !== norm(rawSpecies)) {
      warnings.push(`${slot}번 종족 교정: ${rawSpecies} → ${species}`);
    }

    const rawAbility = (member.ability ?? "").trim();
    const ability = nearest(rawAbility, ABILITIES)?.name ?? rawAbility;

    const { item, moves, unmatched } = classify(member);
    for (const text of unmatched) {
      warnings.push(`${slot}번 미확인 텍스트: ${text}`);
    }
    if (!item) {
      warnings.push(`${slot}번 도구 미확인 — 빌더에서 확인`);
    }

    const evs = { H: 0, A: 0, B: 0, C: 0, D: 0, S: 0 };
    for (const key of STAT_KEYS) {
      evs[key] = toEv(member.points?.[key]);
    }

    return {
      species,
      ability,
      item,
      nature: (member.nature ?? "노력").trim() || "노력",
      teraType: "노말",
      moves: [moves[0] ?? "", moves[1] ?? "", moves[2] ?? "", moves[3] ?? ""],
      evs,
    };
  });
  return { party, warnings };
};

const parseJsonLoose = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return [];
      }
    }
    return [];
  }
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
        options: { num_predict: 2000, temperature: 0 },
        messages: [{ role: "user", content: PROMPT, images: [base64] }],
      }),
    });
  } catch {
    throw new Error(`로컬 비전 서버(Ollama)에 연결 못 함 — ollama 실행 + '${OLLAMA_MODEL}' pull 확인`);
  }
  if (!response.ok) {
    throw new Error(`Ollama 오류 ${response.status} (모델 '${OLLAMA_MODEL}' 확인)`);
  }
  const data = (await response.json()) as { message?: { content?: string; thinking?: string } };
  const text = data.message?.content?.trim() || data.message?.thinking?.trim() || "[]";
  const parsed = parseJsonLoose(text);
  if (Array.isArray(parsed)) {
    return parsed as RawMember[];
  }
  return ((parsed as { party?: RawMember[] }).party ?? []) as RawMember[];
};
