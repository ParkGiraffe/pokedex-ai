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

// 상대 액티브는 종족만 알 수 있으므로 나머지 필드는 자리표시자로 채운다(export는 종족·HP만 사용).
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
  // 메가 폼 슬러그. "" = 비메가. 종족이 메가 가능하면 토글로 자동(1개) 또는 select(X/Y).
  myMegaForm: string;
  opponentMegaForm: string;
  // 랭크·상태는 데미지 계산에 직접 반영된다.
  myRanks: RankBlock;
  opponentRanks: RankBlock;
  myStatus: StatusCondition | '';
  opponentStatus: StatusCondition | '';
  // 살아있는(교체 가능한) 종족. 빈 배열이면 파티 전체. 기절한 포켓몬을 빼면 교체 후보에서 제외된다.
  rosterSpecies: string[];
  // 필드 상태(진입 위험·스크린·순풍). 데미지·교체 평가·선공 판정에 반영된다.
  field: BattleField;
};

// 내 액티브 종족의 가능한 메가 폼 목록.
export const activeMegaOptions = (input: BattleInput): MegaForm[] => {
  const myActive = input.myParty[input.myActiveIndex];
  return myActive ? findMegasBySpecies(myActive.species) : [];
};

// 상대 종족의 가능한 메가 폼 목록.
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

// 한글 종성 검사로 "으로"/"로" 조사를 자연스럽게 붙인다. 한글 밖 문자는 기본 "로".
const withLo = (word: string): string => {
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xac00 || last > 0xd7a3) {
    return `${word}로`;
  }
  return (last - 0xac00) % 28 === 0 ? `${word}로` : `${word}으로`;
};

// 결정론 인배틀 어드바이저. ranks·status·메가가 데미지/매치업 계산에 그대로 반영된다.
export const battleAdvice = (input: BattleInput): BattleAdvice | undefined => {
  const myActive = input.myParty[input.myActiveIndex];
  if (!myActive || !findPokemon(input.opponentSpecies)) {
    return undefined;
  }
  const moves = battleOptions(input) ?? [];
  const opponentMega = resolveMega(opponentMegaOptions(input), input.opponentMegaForm);
  // 교체 후보는 살아있는 종족(roster)만. 빈 배열이면 파티 전체로 본다.
  const roster = input.rosterSpecies.length > 0 ? input.rosterSpecies : input.myParty.map((m) => m.species);
  const bench = input.myParty.filter(
    (member, index) => index !== input.myActiveIndex && roster.includes(member.species),
  );
  // 교체 후보 평가는 타입 매치업이 아니라 실제 데미지로 한다. 상대 랭크업·메가를 그대로 반영해야
  // "특방 6업 상대엔 약점을 못 찌른다"는 사실이 verdict에 들어가고, 무한 교체 추천을 막는다.
  const downgradeVerdict = (verdict: matchup.MatchupVerdict): matchup.MatchupVerdict =>
    verdict === '유리' ? '호각' : '불리';
  // 교체 진입 위험(스텔스록+압정)이 HP 25% 이상이면 verdict를 한 단계 낮춘다. 비메가 종족 기준으로 진입.
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

  // 선공 판정. 트릭룸이면 느린 쪽이 선공. 내 랭크·마비·메가, 상대 랭크·마비·메가를 반영한다.
  // 상대는 기술 표와 동일하게 0투자 중립 가정.
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

  // 데미지 범위를 verdict로 환산하는 공통 기준. 교체 후보와 현재 액티브를 같은 잣대로 비교한다.
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
  // 현재 액티브도 교체 후보와 동일 기준으로 평가한다(myRanks·status·mega 반영된 topMove 사용).
  const activeVerdict: matchup.MatchupVerdict = topMove
    ? hitsToVerdict(topMove.koChance, topMove.guaranteedHits)
    : '불리';

  let recommendation: string;
  if (topMove && topMove.koChance >= 0.5) {
    // 선공으로 KO면 안전, 후공이면 상대 공격을 한 번 맞고 잡는다는 점을 명시.
    const lead = firstMove === '선공' ? '선공으로 ' : firstMove === '후공' ? '후공이라 한 대 맞지만 ' : '';
    recommendation = `${lead}${withLo(topMove.move)} 노림 (${topMove.hitsText}, KO ${Math.round(topMove.koChance * 100)}%)`;
  } else if (bestSwitch && verdictRank(bestSwitch.verdict) > verdictRank(activeVerdict)) {
    // 교체는 현재 액티브보다 '명확히' 유리할 때만. 동급이면 현재 픽을 유지해 핑퐁을 막는다.
    recommendation = `${withLo(bestSwitch.pick)} 빼는 게 유리`;
  } else if (topMove && topMove.guaranteedHits !== null && topMove.guaranteedHits <= 3) {
    const lead = firstMove === '후공' ? '후공이라 불리하지만 ' : '';
    recommendation = `${lead}${withLo(topMove.move)} ${topMove.hitsText} 압박 (현 상태 유지)`;
  } else {
    // 공격도 교체도 상대를 압박 못 하는 상황(상대 랭크업·내구 우위 등). 무한 교체 추천을 멈춘다.
    recommendation = '공격·교체 모두 압박 어려움 — 상대 랭크 해소(도발·교체 유도)나 상태이상 활용 검토';
  }

  return { moveOptions: moves, switchOptions, firstMove, recommendation };
};

export const buildBattleState = (input: BattleInput): BattleState | undefined => {
  const myActive = input.myParty[input.myActiveIndex];
  if (!myActive || !findPokemon(input.opponentSpecies)) {
    return undefined;
  }
  // 랭크·상태·메가를 필드 슬롯에 그대로 실어, 서버 AI 경로(battleDecisionBody)도 결정론과 같은 데이터를 본다.
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
