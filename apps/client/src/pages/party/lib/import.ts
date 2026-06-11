import { NatureName, type StatBlock, TeraType } from '@pokedex-agent/pokedex-core';

import { createDraft, type MemberDraft } from '../model/store';

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

const STAT_KEYS: Array<keyof StatBlock> = ['H', 'A', 'B', 'C', 'D', 'S'];

const evValue = (raw: unknown): number => {
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, Math.min(32, Math.round(value))) : 0;
};

// 파티 JSON(슬롯 배열) → 파티빌더 드래프트. 누락 필드는 기본값으로 채운다.
export const parsePartyImport = (text: string): MemberDraft[] => {
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data)) {
    throw new Error('파티는 배열 형식이어야 합니다');
  }

  return data.map((entry, index): MemberDraft => {
    const raw = entry as RawMember;
    if (!raw || typeof raw !== 'object' || !raw.species) {
      throw new Error(`${index + 1}번 슬롯에 종족이 없습니다`);
    }
    const base = createDraft();
    const moves = Array.isArray(raw.moves) ? raw.moves.map((move) => String(move ?? '')) : [];
    const evs = { ...base.evs };
    for (const key of STAT_KEYS) {
      evs[key] = evValue(raw.evs?.[key]);
    }
    return {
      species: typeof raw.species === 'string' ? raw.species : '',
      level: typeof raw.level === 'number' ? raw.level : base.level,
      ability: typeof raw.ability === 'string' ? raw.ability : '',
      item: typeof raw.item === 'string' ? raw.item : '',
      // 임의 문자열을 그대로 캐스트하면 actualStat의 NATURE_TABLE 조회에서 터진다. Zod로 검증 후 폴백.
      nature: NatureName.safeParse(raw.nature).success ? (raw.nature as NatureName) : base.nature,
      teraType: TeraType.safeParse(raw.teraType).success ? (raw.teraType as TeraType) : base.teraType,
      moves: [moves[0] ?? '', moves[1] ?? '', moves[2] ?? '', moves[3] ?? ''],
      evs,
    };
  });
};
