import { type Party } from "@pokedex-agent/pokedex-core";

import { type AdviceMon } from "../api";

type Member = Party[number];

// 파티빌더 스탯 약자(H/A/B/C/D/S) → 서버 EV 키(hp/atk/def/spa/spd/spe)
const EV_MAP = { H: "hp", A: "atk", B: "def", C: "spa", D: "spd", S: "spe" } as const;

type EvKey = keyof NonNullable<AdviceMon["evs"]>;
const EV_ENTRIES = Object.entries(EV_MAP) as Array<[keyof Member["evs"], EvKey]>;

export const toAdviceMon = (member: Member, options?: { mega?: boolean }): AdviceMon => {
  const evs: NonNullable<AdviceMon["evs"]> = {};
  for (const [shorthand, key] of EV_ENTRIES) {
    const value = member.evs[shorthand];
    if (value) {
      evs[key] = value;
    }
  }
  return {
    species: member.species,
    moves: member.moves.filter((move) => move.trim().length > 0),
    level: member.level,
    item: member.item,
    ability: member.ability,
    nature: member.nature,
    evs,
    mega: options?.mega ? true : undefined,
  };
};
