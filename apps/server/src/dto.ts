import { BattleState, Party } from "@pokedex-agent/pokedex-core";
import { z } from "zod";

const MegaFormSelection = z
  .object({
    my: z.record(z.string(), z.string()).optional(),
    opponent: z.record(z.string(), z.string()).optional(),
  })
  .optional();

export const AnalyzePartyBody = z.object({ party: Party });
export const MatchupLeadrecBody = z.object({ state: BattleState, megaForms: MegaFormSelection });
export const BattleAdviceBody = z.object({ state: BattleState });

const StatSpread = z
  .object({
    hp: z.number().optional(),
    atk: z.number().optional(),
    def: z.number().optional(),
    spa: z.number().optional(),
    spd: z.number().optional(),
    spe: z.number().optional(),
  })
  .optional();

const MyMon = z.object({
  species: z.string().min(1),
  moves: z.array(z.string()).default([]),
  level: z.number().int().min(1).max(100).optional(),
  item: z.string().optional(),
  ability: z.string().optional(),
  nature: z.string().optional(),
  evs: StatSpread,
  ivs: StatSpread,
  boosts: StatSpread,
  teraType: z.string().optional(),
  terastallized: z.boolean().optional(),
  mega: z.boolean().optional(),
  megaForme: z.enum(["X", "Y"]).optional(),
  curHP: z.number().optional(),
  status: z.enum(["", "slp", "psn", "brn", "frz", "par", "tox"]).optional(),
});

const Field = z
  .object({
    weather: z.enum(["Rain", "Sun", "Sand", "Snow"]).optional(),
    terrain: z.enum(["Electric", "Grassy", "Psychic", "Misty"]).optional(),
  })
  .optional();

export const TeamSelectBody = z.object({
  myTeam: z.array(MyMon).min(1),
  opponentTeam: z.array(z.string().min(1)).min(1),
  field: Field,
});

export const DecideBody = z.object({
  active: MyMon,
  opponentSpecies: z.string().min(1),
  bench: z.array(MyMon).default([]),
  field: Field,
});

export const CounterBody = z.object({
  opponentSpecies: z.string().min(1),
  myPool: z.array(MyMon).min(1),
  field: Field,
});

export const ImportPartyBody = z
  .object({
    image: z.string().min(1).optional(),
    images: z.array(z.string().min(1)).optional(),
  })
  .refine((body) => Boolean(body.image) || Boolean(body.images?.length), {
    message: "이미지가 필요합니다",
  });
