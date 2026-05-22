import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// 로컬 비전 모델(Ollama). 기본 qwen2.5vl:7b (thinking 없어 JSON 깔끔, 빠름).
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5vl:7b";
const CORE = resolve(import.meta.dirname, "../../../packages/pokedex-core/data");

const PROMPT = [
  "포켓몬 챔피언스 팀 화면 이미지다. 먼저 이 화면이 어떤 종류인지 판단하라.",
  "(가) 기술(예: 지진, 칼춤, 방어)이 보이는 '능력' 화면 → 각 포켓몬의 species, ability(특성), item(도구), moves(기술 4개)를 채우고 points는 전부 0.",
  "(나) 능력치 막대와 숫자(HP/공격/방어/특수공격/특수방어/스피드)가 보이는 '스테이터스' 화면 → 각 포켓몬의 species와 points만 채워라. 각 스탯 옆 '작은' 숫자가 노력 포인트(0~32)다. 이 화면에서는 ability·item을 빈 문자열, moves를 빈 배열로 둔다(스탯 이름을 기술로 착각하지 마라).",
  '오직 JSON만 출력: {"party":[{"species":"종족명","ability":"특성","item":"도구","nature":"성격","moves":["기술1","기술2","기술3","기술4"],"points":{"H":0,"A":0,"B":0,"C":0,"D":0,"S":0}}]}',
  "- 화면의 한국어 그대로 옮긴다. 안 보이는 항목은 빈 문자열(숫자는 0). 추측 금지.",
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

// 스테이터스 화면에서 새어 들어오는 능력치 라벨(기술/도구 아님) — 분류에서 제외.
const STAT_LABELS = new Set(
  ["hp", "체력", "공격", "방어", "특수공격", "특수방어", "특공", "특방", "스피드", "스피드업", "능력", "스테이터스"].map(
    norm
  )
);

// 모델이 도구/기술 칸을 헷갈리므로, item+moves 텍스트를 한 풀로 모아 사전으로 재분류한다.
const classify = (raw: RawMember): { item: string; moves: string[]; unmatched: string[] } => {
  const texts = [raw.item, ...(raw.moves ?? [])]
    .map((value) => String(value ?? "").trim())
    .filter((value) => value && !STAT_LABELS.has(norm(value)));
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

const pointSum = (points?: Points): number =>
  points ? STAT_KEYS.reduce((sum, key) => sum + (Number(points[key]) || 0), 0) : 0;
const movesCount = (moves?: string[]): number => (moves ?? []).filter(Boolean).length;

// 여러 화면(능력=기술, 스테이터스=EV 등)을 종족 기준으로 병합한다.
export const mergeMembers = (lists: RawMember[][]): RawMember[] => {
  const groups = new Map<string, RawMember>();
  const order: string[] = [];
  for (const list of lists) {
    for (const member of list) {
      const canonical = nearest(member.species ?? "", SPECIES)?.name ?? (member.species ?? "").trim();
      const key = norm(canonical);
      if (!key) {
        continue;
      }
      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, { ...member, species: canonical });
        order.push(key);
        continue;
      }
      if (movesCount(member.moves) > movesCount(existing.moves)) {
        existing.moves = member.moves;
      }
      if (!existing.ability && member.ability) {
        existing.ability = member.ability;
      }
      if (!existing.item && member.item) {
        existing.item = member.item;
      }
      if (!existing.nature && member.nature) {
        existing.nature = member.nature;
      }
      if (pointSum(member.points) > pointSum(existing.points)) {
        existing.points = member.points;
      }
    }
  }
  return order.map((key) => groups.get(key)!);
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
