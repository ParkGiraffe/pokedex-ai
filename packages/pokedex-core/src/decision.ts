import { type DamageCategory, calculateDamage } from "./formula/damage";
import { actualStat } from "./formula/stat";
import { findMove, findPokemon } from "./lookup";
import type { PartyMember, TypeName } from "./types";

export type MoveOption = {
  move: string;
  type: string;
  category: string;
  power: number | null;
  min: number;
  max: number;
  koChance: number; // 0..1, 16롤 중 KO 비율
  damaging: boolean;
};

// 상대 방어·HP는 0투자 중립을 가정한다 (보수적, 응답에서 가정 명시).
const OPPONENT_NATURE = "노력";

export const moveOptions = (
  myActive: PartyMember,
  opponentSpecies: string,
  opponentHpPercent = 100
): MoveOption[] | undefined => {
  const myEntry = findPokemon(myActive.species);
  const opponentEntry = findPokemon(opponentSpecies);
  if (!myEntry || !opponentEntry) {
    return undefined;
  }

  const opponentHp = actualStat({
    stat: "H",
    base: opponentEntry.base.H,
    iv: 31,
    ev: 0,
    level: myActive.level,
    nature: OPPONENT_NATURE,
  });
  const currentHp = Math.max(1, Math.ceil((opponentHp * opponentHpPercent) / 100));

  return myActive.moves.map((moveName) => {
    const move = findMove(moveName);
    if (!move || move.category === "변화" || move.power === null) {
      return {
        move: moveName,
        type: move?.type ?? "?",
        category: move?.category ?? "?",
        power: move?.power ?? null,
        min: 0,
        max: 0,
        koChance: 0,
        damaging: false,
      };
    }

    const physical = move.category === "물리";
    const attackKey = physical ? "A" : "C";
    const defenseKey = physical ? "B" : "D";
    const attack = actualStat({
      stat: attackKey,
      base: myEntry.base[attackKey],
      iv: myActive.ivs[attackKey],
      ev: myActive.evs[attackKey],
      level: myActive.level,
      nature: myActive.nature,
    });
    const defense = actualStat({
      stat: defenseKey,
      base: opponentEntry.base[defenseKey],
      iv: 31,
      ev: 0,
      level: myActive.level,
      nature: OPPONENT_NATURE,
    });

    const result = calculateDamage({
      level: myActive.level,
      attack,
      defense,
      basePower: move.power,
      category: move.category as DamageCategory,
      attackerTypes: myEntry.types,
      defenderTypes: opponentEntry.types,
      moveType: move.type as TypeName,
      attackerTerastalized: false,
    });

    const koRolls = result.rolls.filter((roll) => roll >= currentHp).length;

    return {
      move: moveName,
      type: move.type,
      category: move.category,
      power: move.power,
      min: result.min,
      max: result.max,
      koChance: koRolls / result.rolls.length,
      damaging: true,
    };
  });
};
