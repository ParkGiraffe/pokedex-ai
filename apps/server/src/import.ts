import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

// Claude 비전. 기본 claude-opus-4-7 (한국어 OCR·게임 UI 정확도 최상).
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";
const anthropic = new Anthropic();
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
const NATURES = readKo("natures.json", "natures");

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
      // 성격은 화면에 텍스트로 안 보이는 경우가 많아, 유효 성격으로만 채우고 아니면 중립(노력).
      nature: nearest((member.nature ?? "").trim(), NATURES)?.name ?? "노력",
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

// Structured Outputs로 응답 JSON 형식을 보장 — 느슨한 파싱 불필요.
const PartySchema = z.object({
  party: z.array(
    z.object({
      species: z.string(),
      ability: z.string(),
      item: z.string(),
      nature: z.string(),
      moves: z.array(z.string()),
      points: z.object({
        H: z.number(),
        A: z.number(),
        B: z.number(),
        C: z.number(),
        D: z.number(),
        S: z.number(),
      }),
    })
  ),
});

export const extractPartyFromImage = async (base64: string): Promise<RawMember[]> => {
  try {
    const response = await anthropic.messages.parse({
      model: ANTHROPIC_MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(PartySchema) },
    });
    return response.parsed_output?.party ?? [];
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new Error("Claude API 인증 실패 — ANTHROPIC_API_KEY 환경변수 확인");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new Error("Claude API 한도 초과 — 잠시 후 재시도");
    }
    throw error;
  }
};
