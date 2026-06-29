import {
  type BattleState,
  decision,
  findMegasBySpecies,
  findPokemon,
  formula,
  type matchup,
  type MegaForm,
  type Party,
  type PartyMember,
  PERFECT_IVS,
  type StatusCondition,
  type Weather,
} from '@pokedex-agent/pokedex-core';

import { type BattleField, type RankBlock } from '../model/store';

const DEFAULT_RANKS = { A: 0, B: 0, C: 0, D: 0, S: 0, accuracy: 0, evasion: 0 };

const stubOpponent = (species: string, level: number): PartyMember => ({
  species,
  level,
  nature: '노력',
  ability: '?',
  teraType: '노말',
  moves: ['?', '?', '?', '?'],
  evs: { H: 0, A: 0, B: 0, C: 0, D: 0, S: 0 },
  ivs: PERFECT_IVS,
});

export type BattleInput = {
  myParty: Party;
  myActiveIndex: number;
  opponentSpecies: string;
  opponentHpPercent: number;
  weather: Weather | '';
  trickRoom: boolean;
  turn: number;
  myMegaForm: string;
  opponentMegaForm: string;
  myRanks: RankBlock;
  opponentRanks: RankBlock;
  myStatus: StatusCondition | '';
  opponentStatus: StatusCondition | '';
  rosterSpecies: string[];
  field: BattleField;
};

export const activeMegaOptions = (input: BattleInput): MegaForm[] => {
  const myActive = input.myParty[input.myActiveIndex];
  return myActive ? findMegasBySpecies(myActive.species) : [];
};

export const opponentMegaOptions = (input: BattleInput): MegaForm[] => findMegasBySpecies(input.opponentSpecies);

const resolveMega = (options: MegaForm[], slug: string): MegaForm | undefined =>
  slug ? options.find((mega) => mega.form === slug) : undefined;

export const battleOptions = (input: BattleInput): decision.MoveOption[] | undefined => {
  const myActive = input.myParty[input.myActiveIndex];
  if (!myActive) {
    return undefined;
  }
  const mega = resolveMega(activeMegaOptions(input), input.myMegaForm);
  const opponentMega = resolveMega(opponentMegaOptions(input), input.opponentMegaForm);
  return decision.moveOptions(myActive, input.opponentSpecies, input.opponentHpPercent, {
    mega,
    opponentMega,
    myRanks: input.myRanks,
    opponentRanks: input.opponentRanks,
    myStatus: input.myStatus,
    opponentScreens: {
      light: input.field.opponentLightScreen,
      reflect: input.field.opponentReflect,
    },
  });
};

export type SwitchOption = { pick: string; verdict: matchup.MatchupVerdict };
export type FirstMove = '선공' | '후공' | '동속';
export type BattleAdvice = {
  moveOptions: decision.MoveOption[];
  switchOptions: SwitchOption[];
  firstMove: FirstMove;
  recommendation: string;
};

const verdictRank = (verdict: matchup.MatchupVerdict): number => (verdict === '유리' ? 1 : verdict === '불리' ? -1 : 0);

const withLo = (word: string): string => {
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xac00 || last > 0xd7a3) {
    return `${word}로`;
  }
  return (last - 0xac00) % 28 === 0 ? `${word}로` : `${word}으로`;
};

export const battleAdvice = (input: BattleInput): BattleAdvice | undefined => {
  const myActive = input.myParty[input.myActiveIndex];
  if (!myActive || !findPokemon(input.opponentSpecies)) {
    return undefined;
  }
  const moves = battleOptions(input) ?? [];
  const opponentMega = resolveMega(opponentMegaOptions(input), input.opponentMegaForm);
  const roster = input.rosterSpecies.length > 0 ? input.rosterSpecies : input.myParty.map((m) => m.species);
  const bench = input.myParty.filter(
    (member, index) => index !== input.myActiveIndex && roster.includes(member.species),
  );
  const downgradeVerdict = (verdict: matchup.MatchupVerdict): matchup.MatchupVerdict =>
    verdict === '유리' ? '호각' : '불리';
  const entryDamageRatio = (mon: PartyMember): number => {
    const entry = findPokemon(mon.species);
    if (!entry) {
      return 0;
    }
    const maxHp = formula.actualStat({
      stat: 'H',
      base: entry.base.H,
      iv: mon.ivs.H,
      ev: mon.evs.H,
      level: mon.level,
      nature: mon.nature,
    });
    let damage = 0;
    if (input.field.myStealthRock) {
      damage += formula.stealthRockDamage(entry.types, maxHp);
    }
    if (input.field.mySpikes > 0) {
      damage += formula.spikesDamage(entry.types, maxHp, input.field.mySpikes as 1 | 2 | 3);
    }
    return maxHp > 0 ? damage / maxHp : 0;
  };
  const switchVerdict = (mon: PartyMember): matchup.MatchupVerdict => {
    const opts =
      decision.moveOptions(mon, input.opponentSpecies, input.opponentHpPercent, {
        opponentMega,
        opponentRanks: input.opponentRanks,
        opponentScreens: {
          light: input.field.opponentLightScreen,
          reflect: input.field.opponentReflect,
        },
      }) ?? [];
    const best = opts
      .filter((o) => o.damaging && o.guaranteedHits !== null)
      .sort((a, b) => b.koChance - a.koChance || (a.guaranteedHits ?? 99) - (b.guaranteedHits ?? 99))[0];
    let verdict: matchup.MatchupVerdict;
    if (!best || best.guaranteedHits === null) {
      verdict = '불리';
    } else if (best.koChance >= 0.5 || best.guaranteedHits <= 2) {
      verdict = '유리';
    } else if (best.guaranteedHits === 3) {
      verdict = '호각';
    } else {
      verdict = '불리';
    }
    if (entryDamageRatio(mon) >= 0.25) {
      verdict = downgradeVerdict(verdict);
    }
    return verdict;
  };
  const switchOptions: SwitchOption[] = bench
    .filter((mon) => findPokemon(mon.species))
    .map((mon) => ({ pick: mon.species, verdict: switchVerdict(mon) }));

  const topMove = [...moves]
    .filter((option) => option.damaging)
    .sort((a, b) => b.koChance - a.koChance || b.max - a.max)[0];
  const bestSwitch = [...switchOptions].sort((a, b) => verdictRank(b.verdict) - verdictRank(a.verdict))[0];

  const myMega = resolveMega(activeMegaOptions(input), input.myMegaForm);
  const opponentEntry = findPokemon(input.opponentSpecies);
  const myEntry = findPokemon(myActive.species);
  const myBaseS = myMega ? myMega.base.S : (myEntry?.base.S ?? 0);
  const oppBaseS = opponentMega ? opponentMega.base.S : (opponentEntry?.base.S ?? 0);
  const mySpeed = formula.effectiveSpeed({
    base: formula.actualStat({
      stat: 'S',
      base: myBaseS,
      iv: myActive.ivs.S,
      ev: myActive.evs.S,
      level: myActive.level,
      nature: myActive.nature,
    }),
    rank: input.myRanks.S,
    tailwind: input.field.myTailwind,
    paralyzed: input.myStatus === '마비',
    stickyWeb: false,
    itemMultiplier: 1,
    abilityMultiplier: 1,
  });
  const oppSpeed = formula.effectiveSpeed({
    base: formula.actualStat({
      stat: 'S',
      base: oppBaseS,
      iv: 31,
      ev: 0,
      level: myActive.level,
      nature: '노력',
    }),
    rank: input.opponentRanks.S,
    tailwind: input.field.opponentTailwind,
    paralyzed: input.opponentStatus === '마비',
    stickyWeb: false,
    itemMultiplier: 1,
    abilityMultiplier: 1,
  });
  const firstMove: FirstMove =
    mySpeed === oppSpeed ? '동속' : (input.trickRoom ? mySpeed < oppSpeed : mySpeed > oppSpeed) ? '선공' : '후공';

  const hitsToVerdict = (koChance: number, guaranteedHits: number | null): matchup.MatchupVerdict => {
    if (guaranteedHits === null) {
      return '불리';
    }
    if (koChance >= 0.5 || guaranteedHits <= 2) {
      return '유리';
    }
    if (guaranteedHits === 3) {
      return '호각';
    }
    return '불리';
  };
  const activeVerdict: matchup.MatchupVerdict = topMove
    ? hitsToVerdict(topMove.koChance, topMove.guaranteedHits)
    : '불리';

  let recommendation: string;
  if (topMove && topMove.koChance >= 0.5) {
    const lead = firstMove === '선공' ? '선공으로 ' : firstMove === '후공' ? '후공이라 한 대 맞지만 ' : '';
    recommendation = `${lead}${withLo(topMove.move)} 노림 (${topMove.hitsText}, KO ${Math.round(topMove.koChance * 100)}%)`;
  } else if (bestSwitch && verdictRank(bestSwitch.verdict) > verdictRank(activeVerdict)) {
    recommendation = `${withLo(bestSwitch.pick)} 빼는 게 유리`;
  } else if (topMove && topMove.guaranteedHits !== null && topMove.guaranteedHits <= 3) {
    const lead = firstMove === '후공' ? '후공이라 불리하지만 ' : '';
    recommendation = `${lead}${withLo(topMove.move)} ${topMove.hitsText} 압박 (현 상태 유지)`;
  } else {
    recommendation = '공격·교체 모두 압박 어려움 — 상대 랭크 해소(도발·교체 유도)나 상태이상 활용 검토';
  }

  return { moveOptions: moves, switchOptions, firstMove, recommendation };
};

export const buildBattleState = (input: BattleInput): BattleState | undefined => {
  const myActive = input.myParty[input.myActiveIndex];
  if (!myActive || !findPokemon(input.opponentSpecies)) {
    return undefined;
  }
  const toRanks = (ranks: RankBlock) => ({ ...DEFAULT_RANKS, ...ranks });
  return {
    my: input.myParty,
    opponent: {
      revealed: [{ species: input.opponentSpecies }],
      field: [
        {
          member: stubOpponent(input.opponentSpecies, myActive.level),
          hpPercent: input.opponentHpPercent,
          ranks: toRanks(input.opponentRanks),
          status: input.opponentStatus || undefined,
          megaForm: input.opponentMegaForm || undefined,
          terastalized: false,
        },
      ],
    },
    myField: [
      {
        member: myActive,
        hpPercent: 100,
        ranks: toRanks(input.myRanks),
        status: input.myStatus || undefined,
        megaForm: input.myMegaForm || undefined,
        terastalized: false,
      },
    ],
    weather: input.weather || undefined,
    trickRoom: input.trickRoom,
    turn: input.turn,
    battleField: input.field,
  };
};
