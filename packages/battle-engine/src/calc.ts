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
  mega?: boolean; // 메가진화 (챔피언스). 테라와 동시 불가 — 기믹 1개 규칙
  megaForme?: "X" | "Y"; // 리자몽·뮤츠 등 2종 메가 구분
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

// 메가 폼 종족명 (예: charizard + Y -> charizard-mega-y). @smogon/calc이 폼 종족값·타입·특성을 자동 적용.
const megaSpeciesName = (baseEn: string, forme?: "X" | "Y"): string =>
  forme ? `${baseEn}-mega-${forme.toLowerCase()}` : `${baseEn}-mega`;

export const toCalcPokemon = (side: EngineSide): Pokemon => buildPokemon(side);

const buildPokemon = (side: EngineSide): Pokemon => {
  const baseEn = enSpecies(side.species);
  if (side.mega) {
    // 메가는 폼 고유 특성(부모자식사랑 등)을 쓰므로 기존 특성·도구(메가스톤)·테라를 넘기지 않는다.
    try {
      return new Pokemon(gen, megaSpeciesName(baseEn, side.megaForme), {
        level: side.level ?? 50,
        nature: side.nature ? natureEnOf(side.nature) : undefined,
        evs: side.evs,
        ivs: side.ivs,
        boosts: side.boosts,
        curHP: side.curHP,
        status: side.status,
      });
    } catch {
      // 존재하지 않는 메가 폼이면 기본 종족으로 폴백한다(챔피언스↔smogon/calc 데이터 어긋남).
      // 이 패키지는 순수 라이브러리라 로거가 없다. 메가 폼 디버깅은 호출 측에서 활성 메가 목록을 확인할 것.
    }
  }
  return new Pokemon(gen, baseEn, {
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
};

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
  // kochance().chance는 n번째 타격까지의 KO 확률이다(약한 기술은 9타 후 100%).
  // 이번 턴 결정타 판단엔 OHKO 확률(n===1)만 의미가 있다.
  return {
    min: range[0],
    max: range[1],
    koChance: ko.n === 1 ? (ko.chance ?? 1) : 0,
    koText: ko.text,
    desc: result.desc(),
  };
};
