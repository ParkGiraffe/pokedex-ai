import {
  findPokemon,
  formula,
  type Party,
  PartyMember,
  PERFECT_IVS,
  type TypeName,
  TYPE_NAMES,
} from "@pokedex-agent/pokedex-core";

import { type MemberDraft } from "../model/store";

const normalize = (draft: MemberDraft) => ({
  ...draft,
  item: draft.item.trim() || undefined,
  ivs: PERFECT_IVS,
});

// Zod 기본 메시지(영어) 대신 어떤 칸이 비었는지 한국어로 안내한다.
const FIELD_LABEL: Record<string, string> = {
  species: "포켓몬",
  ability: "특성",
  item: "도구",
  nature: "성격",
  teraType: "테라",
  evs: "노력치",
  level: "레벨",
};

export const memberError = (draft: MemberDraft): string | null => {
  const parsed = PartyMember.safeParse(normalize(draft));
  if (parsed.success) {
    return null;
  }
  const field = parsed.error.issues[0]?.path[0];
  if (field === "moves") {
    return "기술 4개를 모두 입력하세요";
  }
  const label = typeof field === "string" ? FIELD_LABEL[field] : undefined;
  return label ? `${label} 칸을 채우세요` : "슬롯 정보를 확인하세요";
};

export const buildParty = (drafts: MemberDraft[]): Party => {
  const built: Party = [];
  for (const draft of drafts) {
    const parsed = PartyMember.safeParse(normalize(draft));
    if (parsed.success) {
      built.push(parsed.data);
    }
  }
  return built;
};

export type TeamWeakness = {
  type: TypeName;
  weakCount: number;
  resistCount: number;
};

export const teamWeakness = (drafts: MemberDraft[]): TeamWeakness[] => {
  const memberTypes = drafts
    .map((draft) => findPokemon(draft.species)?.types)
    .filter((types): types is TypeName[] => Boolean(types));

  return TYPE_NAMES.map((type) => {
    let weakCount = 0;
    let resistCount = 0;
    for (const types of memberTypes) {
      const effectiveness = formula.typeEffectiveness(type, types);
      if (effectiveness > 1) {
        weakCount += 1;
      } else if (effectiveness < 1) {
        resistCount += 1;
      }
    }
    return { type, weakCount, resistCount };
  });
};
