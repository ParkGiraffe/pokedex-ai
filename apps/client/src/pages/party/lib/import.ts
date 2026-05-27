import { type NatureName, type StatBlock, type TeraType } from "@pokedex-agent/pokedex-core";

import { createDraft, type MemberDraft } from "../model/store";

type RawMember = {
  species?: unknown;
  level?: unknown;
  ability?: unknown;
  item?: unknown;
  nature?: unknown;
  teraType?: unknown;
  moves?: unknown;
  evs?: Partial<Record<keyof StatBlock, unknown>>;
};

const STAT_KEYS: Array<keyof StatBlock> = ["H", "A", "B", "C", "D", "S"];

const evValue = (raw: unknown): number => {
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, Math.min(32, Math.round(value))) : 0;
};

// 파티 JSON(슬롯 배열) → 파티빌더 드래프트. 누락 필드는 기본값으로 채운다.
export const parsePartyImport = (text: string): MemberDraft[] => {
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data)) {
    throw new Error("파티는 배열 형식이어야 합니다");
  }

  return data.map((entry, index): MemberDraft => {
    const raw = entry as RawMember;
    if (!raw || typeof raw !== "object" || !raw.species) {
      throw new Error(`${index + 1}번 슬롯에 종족이 없습니다`);
    }
    const base = createDraft();
    const moves = Array.isArray(raw.moves) ? raw.moves.map((move) => String(move ?? "")) : [];
    const evs = { ...base.evs } as StatBlock;
    for (const key of STAT_KEYS) {
      evs[key] = evValue(raw.evs?.[key]);
    }
    return {
      species: String(raw.species),
      level: typeof raw.level === "number" ? raw.level : base.level,
      ability: raw.ability ? String(raw.ability) : "",
      item: raw.item ? String(raw.item) : "",
      nature: (raw.nature as NatureName) ?? base.nature,
      teraType: (raw.teraType as TeraType) ?? base.teraType,
      moves: [moves[0] ?? "", moves[1] ?? "", moves[2] ?? "", moves[3] ?? ""],
      evs,
    };
  });
};
