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

export const memberError = (draft: MemberDraft): string | null => {
  const parsed = PartyMember.safeParse(normalize(draft));
  if (parsed.success) {
    return null;
  }
  return parsed.error.issues[0]?.message ?? "입력 오류";
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
