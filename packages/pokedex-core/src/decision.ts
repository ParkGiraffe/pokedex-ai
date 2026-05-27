import { type DamageCategory, calculateDamage } from "./formula/damage";
import { actualStat } from "./formula/stat";
import { findMove, findPokemon } from "./lookup";
import type { MegaForm } from "./megas";
import type { PartyMember, TypeName } from "./types";

export type MoveOption = {
  move: string;
  type: string;
  category: string;
  power: number | null;
  min: number;
  max: number;
  koChance: number; // 0..1, 16롤 중 1HKO 비율
  damaging: boolean;
  // 한국 SV 데미지 표기: 최소 데미지 기준 확정 N타, 최대 데미지 기준 난수 N타.
  // 같은 값이면 "확정 N타", 다르면 "난수 N타~확정 M타".
  guaranteedHits: number | null; // min damage 기준 N타 KO. min=0이면 null.
  possibleHits: number | null; // max damage 기준 최소 N타 KO.
  hitsText: string; // 표시용: "확정 1타" | "난수 2타~확정 3타" | "" (변화기)
};

// 상대 방어·HP는 0투자 중립을 가정한다 (보수적, 응답에서 가정 명시).
const OPPONENT_NATURE = "노력";

// 데미지 범위와 현재 HP로 한국 SV 표준 "확정 N타 / 난수 N타" 표기를 만든다.
// guaranteedHits = ceil(HP / min) — 최소 데미지로도 N타에 무조건 KO
// possibleHits   = ceil(HP / max) — 최대 데미지로 N타에 KO 가능
const hitsToKO = (min: number, max: number, hp: number) => {
  if (min <= 0 || max <= 0 || hp <= 0) {
    return { guaranteed: null, possible: null, text: "" };
  }
  const guaranteed = Math.ceil(hp / min);
  const possible = Math.ceil(hp / max);
  const text = guaranteed === possible ? `확정 ${guaranteed}타` : `난수 ${possible}타~확정 ${guaranteed}타`;
  return { guaranteed, possible, text };
};

export type MoveOptionsContext = {
  mega?: MegaForm; // 내 액티브 메가 활성 시 종족값·타입·자속을 메가 폼으로 swap한다.
  opponentMega?: MegaForm; // 상대 메가 활성 시 상대 종족값·타입을 swap한다.
};

export const moveOptions = (
  myActive: PartyMember,
  opponentSpecies: string,
  opponentHpPercent = 100,
  context: MoveOptionsContext = {}
): MoveOption[] | undefined => {
  const baseEntry = findPokemon(myActive.species);
  const opponentBaseEntry = findPokemon(opponentSpecies);
  if (!baseEntry || !opponentBaseEntry) {
    return undefined;
  }
  const myEntry = context.mega
    ? { ...baseEntry, base: context.mega.base, types: context.mega.types }
    : baseEntry;
  const opponentEntry = context.opponentMega
    ? { ...opponentBaseEntry, base: context.opponentMega.base, types: context.opponentMega.types }
    : opponentBaseEntry;

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
        guaranteedHits: null,
        possibleHits: null,
        hitsText: "",
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
    const hits = hitsToKO(result.min, result.max, currentHp);

    return {
      move: moveName,
      type: move.type,
      category: move.category,
      power: move.power,
      min: result.min,
      max: result.max,
      koChance: koRolls / result.rolls.length,
      damaging: true,
      guaranteedHits: hits.guaranteed,
      possibleHits: hits.possible,
      hitsText: hits.text,
    };
  });
};
