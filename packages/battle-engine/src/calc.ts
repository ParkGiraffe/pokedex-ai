import { findAbility, findItem, findMove, findPokemon, natureEnOf, typeEnOf } from '@pokedex-agent/pokedex-core';
import { calculate, Field, Generations, Move, Pokemon } from '@smogon/calc';

const gen = Generations.get(9);

export type StatSpread = Partial<Record<'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', number>>;

export type EngineSide = {
  species: string;
  level?: number;
  ability?: string;
  item?: string;
  nature?: string;
  evs?: StatSpread;
  ivs?: StatSpread;
  boosts?: StatSpread;
  teraType?: string;
  terastallized?: boolean;
  mega?: boolean;
  megaForme?: 'X' | 'Y';
  curHP?: number;
  status?: '' | 'slp' | 'psn' | 'brn' | 'frz' | 'par' | 'tox';
};

export type EngineField = {
  weather?: 'Rain' | 'Sun' | 'Sand' | 'Snow';
  terrain?: 'Electric' | 'Grassy' | 'Psychic' | 'Misty';
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
const enItem = (item?: string): string | undefined => (item ? (findItem(item)?.en ?? item) : undefined);
const enAbility = (ability?: string): string | undefined =>
  ability ? (findAbility(ability)?.en ?? ability) : undefined;

const megaSpeciesName = (baseEn: string, forme?: 'X' | 'Y'): string =>
  forme ? `${baseEn}-mega-${forme.toLowerCase()}` : `${baseEn}-mega`;

export const toCalcPokemon = (side: EngineSide): Pokemon => buildPokemon(side);

const buildPokemon = (side: EngineSide): Pokemon => {
  const baseEn = enSpecies(side.species);
  if (side.mega) {
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
  field?: EngineField,
): CalcResult => {
  const battleField = field ? new Field(field) : undefined;
  const result = calculate(
    gen,
    buildPokemon(attacker),
    buildPokemon(defender),
    new Move(gen, enMove(move)),
    battleField,
  );
  const range = result.range();
  if (range[1] === 0) {
    return { min: 0, max: 0, koChance: 0, koText: '데미지 없음', desc: `${move} → ${defender.species}: 무효` };
  }
  const ko = result.kochance();
  return {
    min: range[0],
    max: range[1],
    koChance: ko.n === 1 ? (ko.chance ?? 1) : 0,
    koText: ko.text,
    desc: result.desc(),
  };
};
