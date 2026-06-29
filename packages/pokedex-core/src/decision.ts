import { calculateDamage } from './formula/damage';
import { actualStat, applyRank } from './formula/stat';
import { findMove, findPokemon } from './lookup';
import type { MegaForm } from './megas';
import type { PartyMember, StatusCondition, TypeName } from './types';

export type MoveOption = {
  move: string;
  type: string;
  category: string;
  power: number | null;
  min: number;
  max: number;
  koChance: number;
  damaging: boolean;
  guaranteedHits: number | null;
  possibleHits: number | null;
  hitsText: string;
};

const OPPONENT_NATURE = '노력';

const hitsToKO = (min: number, max: number, hp: number) => {
  if (min <= 0 || max <= 0 || hp <= 0) {
    return { guaranteed: null, possible: null, text: '' };
  }
  const guaranteed = Math.ceil(hp / min);
  const possible = Math.ceil(hp / max);
  const text = guaranteed === possible ? `확정 ${guaranteed}타` : `난수 ${possible}타`;
  return { guaranteed, possible, text };
};

export type StatRanks = Partial<Record<'A' | 'B' | 'C' | 'D' | 'S', number>>;

export type MoveOptionsContext = {
  mega?: MegaForm;
  opponentMega?: MegaForm;
  myRanks?: StatRanks;
  opponentRanks?: StatRanks;
  myStatus?: StatusCondition | '';
  opponentScreens?: { light?: boolean; reflect?: boolean };
};

export const moveOptions = (
  myActive: PartyMember,
  opponentSpecies: string,
  opponentHpPercent = 100,
  context: MoveOptionsContext = {},
): MoveOption[] | undefined => {
  const baseEntry = findPokemon(myActive.species);
  const opponentBaseEntry = findPokemon(opponentSpecies);
  if (!baseEntry || !opponentBaseEntry) {
    return undefined;
  }
  const myEntry = context.mega ? { ...baseEntry, base: context.mega.base, types: context.mega.types } : baseEntry;
  const opponentEntry = context.opponentMega
    ? { ...opponentBaseEntry, base: context.opponentMega.base, types: context.opponentMega.types }
    : opponentBaseEntry;

  const opponentHp = actualStat({
    stat: 'H',
    base: opponentEntry.base.H,
    iv: 31,
    ev: 0,
    level: myActive.level,
    nature: OPPONENT_NATURE,
  });
  const currentHp = Math.max(1, Math.ceil((opponentHp * opponentHpPercent) / 100));

  return myActive.moves.map((moveName) => {
    const move = findMove(moveName);
    if (!move || move.category === '변화' || move.power === null) {
      return {
        move: moveName,
        type: move?.type ?? '?',
        category: move?.category ?? '?',
        power: move?.power ?? null,
        min: 0,
        max: 0,
        koChance: 0,
        damaging: false,
        guaranteedHits: null,
        possibleHits: null,
        hitsText: '',
      };
    }

    const physical = move.category === '물리';
    const attackKey = physical ? 'A' : 'C';
    const defenseKey = physical ? 'B' : 'D';
    const rawAttack = actualStat({
      stat: attackKey,
      base: myEntry.base[attackKey],
      iv: myActive.ivs[attackKey],
      ev: myActive.evs[attackKey],
      level: myActive.level,
      nature: myActive.nature,
    });
    const rawDefense = actualStat({
      stat: defenseKey,
      base: opponentEntry.base[defenseKey],
      iv: 31,
      ev: 0,
      level: myActive.level,
      nature: OPPONENT_NATURE,
    });
    const attack = applyRank(rawAttack, context.myRanks?.[attackKey] ?? 0);
    const defense = applyRank(rawDefense, context.opponentRanks?.[defenseKey] ?? 0);

    const screen = physical ? (context.opponentScreens?.reflect ?? false) : (context.opponentScreens?.light ?? false);
    const result = calculateDamage({
      level: myActive.level,
      attack,
      defense,
      basePower: move.power,
      category: move.category,
      attackerTypes: myEntry.types,
      defenderTypes: opponentEntry.types,
      moveType: move.type as TypeName,
      attackerTerastalized: false,
      burned: context.myStatus === '화상',
      screen,
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
