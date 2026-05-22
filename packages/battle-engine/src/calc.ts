import {
  findAbility,
  findItem,
  findMove,
  findPokemon,
  natureEnOf,
  typeEnOf,
} from "@pokedex-agent/pokedex-core";
import { calculate, Field, Generations, Move, Pokemon } from "@smogon/calc";

const gen = Generations.get(9);

export type StatSpread = Partial<Record<"hp" | "atk" | "def" | "spa" | "spd" | "spe", number>>;

export type EngineSide = {
  species: string; // 한국어/영문
  level?: number;
  ability?: string; // 한국어/영문
  item?: string; // 한국어/영문
  nature?: string; // 한국어(고집)/영문(Adamant)
  evs?: StatSpread;
  ivs?: StatSpread;
  boosts?: StatSpread; // 랭크 -6..+6
  teraType?: string; // 한국어(강철)/영문(Steel)
  terastallized?: boolean;
  curHP?: number;
  status?: "" | "slp" | "psn" | "brn" | "frz" | "par" | "tox";
};

export type EngineField = {
  weather?: "Rain" | "Sun" | "Sand" | "Snow";
  terrain?: "Electric" | "Grassy" | "Psychic" | "Misty";
};

export type CalcResult = {
  min: number;
  max: number;
  koChance: number;
  koText: string;
  desc: string;
};

const enSpecies = (species: string): string => findPokemon(species)?.en ?? species;
const enMove = (move: string): string => findMove(move)?.en ?? move;
const enItem = (item?: string): string | undefined =>
  item ? (findItem(item)?.en ?? item) : undefined;
const enAbility = (ability?: string): string | undefined =>
  ability ? (findAbility(ability)?.en ?? ability) : undefined;

export const toCalcPokemon = (side: EngineSide): Pokemon => buildPokemon(side);

const buildPokemon = (side: EngineSide): Pokemon =>
  new Pokemon(gen, enSpecies(side.species), {
    level: side.level ?? 50,
    ability: enAbility(side.ability),
    item: enItem(side.item),
    nature: side.nature ? natureEnOf(side.nature) : undefined,
    evs: side.evs,
    ivs: side.ivs,
    boosts: side.boosts,
    teraType: side.terastallized && side.teraType ? (typeEnOf(side.teraType) as never) : undefined,
    curHP: side.curHP,
    status: side.status,
  });

export const calcDamage = (
  attacker: EngineSide,
  defender: EngineSide,
  move: string,
  field?: EngineField
): CalcResult => {
  const battleField = field ? new Field(field) : undefined;
  const result = calculate(
    gen,
    buildPokemon(attacker),
    buildPokemon(defender),
    new Move(gen, enMove(move)),
    battleField
  );
  const range = result.range();
  if (range[1] === 0) {
    // 면역·무효: kochance()/desc()가 0 데미지에서 throw하므로 직접 처리.
    return { min: 0, max: 0, koChance: 0, koText: "데미지 없음", desc: `${move} → ${defender.species}: 무효` };
  }
  const ko = result.kochance();
  return {
    min: range[0],
    max: range[1],
    koChance: ko.chance ?? (ko.n > 0 ? 1 : 0),
    koText: ko.text,
    desc: result.desc(),
  };
};
