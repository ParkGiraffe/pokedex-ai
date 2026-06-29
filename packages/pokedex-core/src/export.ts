import { analyzeParty } from './analysis';
import { moveOptions } from './decision';
import type { MatchupContext } from './matchup';
import { coverage, leadBoard } from './matchup';
import { championsItems, findMegaByItem, findMegasBySpecies, type MegaForm } from './megas';
import { metaSummary } from './meta';
import { opponentSetHint } from './samples';
import type { BattleState, Party } from './types';

const TASK_HEADERS = {
  'party-analysis': '## 작업: 파티 분석',
  'matchup-leadrec': '## 작업: 선두 추천',
  'battle-decision': '## 작업: 배틀 의사결정',
} as const;

export type ExportTask = keyof typeof TASK_HEADERS;

const formatMember = (m: Party[number], idx: number): string => {
  const stats = `H${m.evs.H}/A${m.evs.A}/B${m.evs.B}/C${m.evs.C}/D${m.evs.D}/S${m.evs.S}`;
  const item = m.item ?? '(없음)';
  return [
    `${idx + 1}. ${m.species} Lv${m.level}`,
    `   특성: ${m.ability} / 도구: ${item} / 성격: ${m.nature} / 테라: ${m.teraType}`,
    `   기술: ${m.moves.join(', ')}`,
    `   EV: ${stats}`,
  ].join('\n');
};

const partyAnalysisBody = (party: Party): string => {
  const analysis = analyzeParty(party);
  const weakLines = analysis.weakness
    .filter((entry) => entry.weak > 0)
    .sort((a, b) => b.weak - a.weak)
    .map((entry) => `  - ${entry.type}: ${entry.weak}슬롯`);
  const roleLine = Object.entries(analysis.roles)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => `${name} ${count}`)
    .join(', ');
  const meta = metaSummary();

  const megaCarriers = party
    .map((member, index) => ({ member, index, mega: member.item ? findMegaByItem(member.item) : undefined }))
    .filter(
      (
        entry,
      ): entry is { member: Party[number]; index: number; mega: NonNullable<ReturnType<typeof findMegaByItem>> } =>
        entry.mega !== undefined,
    );
  const priorityLabel = (priority: string | undefined): string =>
    priority === 'obligatory'
      ? '메가 필수(비메가 거의 안 씀)'
      : priority === 'flexible'
        ? '비메가도 유효'
        : priority === 'fringe'
          ? '비주류'
          : '데이터 없음';
  const megaLine =
    megaCarriers.length === 0
      ? '- 메가스톤 보유 포켓몬: 없음'
      : `- 메가스톤 보유 포켓몬: ${megaCarriers.length}마리 (${megaCarriers
          .map((e) => `${e.member.species}/${e.member.item} [${priorityLabel(e.mega.megaPriority)}]`)
          .join(', ')})`;

  return [
    '',
    '## 파티',
    party.map(formatMember).join('\n'),
    '',
    '## 정적 분석 (이미 계산된 값, 재계산 불필요)',
    `- 약점 분산 점수: ${analysis.synergy.dispersionScore}/100 (피크 ${analysis.synergy.sharedWeaknessPeak}슬롯)`,
    analysis.synergy.stackedTypes.length > 0
      ? `- 누적 약점(3슬롯 이상): ${analysis.synergy.stackedTypes.join(', ')}`
      : '- 누적 약점(3슬롯 이상): 없음',
    '- 타입별 약점 슬롯 수:',
    ...(weakLines.length > 0 ? weakLines : ['  - 없음']),
    `- 역할 분포: ${roleLine || '없음'}`,
    `- 화력 합계: 물리 ${analysis.balance.physicalPower}, 특수 ${analysis.balance.specialPower}, 내구 ${analysis.balance.bulk}, 최고스피드 ${analysis.balance.topSpeed}`,
    megaLine,
    `- 메타: ${meta ?? '미수집'}`,
    '',
    '## 챔피언스 룰 메모',
    '- 한 배틀에 메가진화는 1마리만 가능하다. 메가스톤 보유 슬롯이 2개 이상이면 하나만 실제로 메가가 되고 나머지는 잉여다.',
    "- 위 [라벨]은 Smogon 챔피언스 사용률 기반 메가 의무도다. '메가 필수'는 비메가가 거의 안 쓰여 그 픽이 메인 메가여야 하고,",
    "  '비메가도 유효'는 비메가로도 제 역할을 하므로 메가스톤을 양보하고 다른 도구(예: 구애·잔반·기합의띠 등 카탈로그 내)로 바꿔도 된다.",
    "- 즉 '메가 필수' 픽이 있으면 그 픽을 메인 메가로 두고, '비메가도 유효'·'비주류' 픽의 메가스톤을 우선 교체 대상으로 제안하라.",
    '',
    '## 챔피언스 도구 카탈로그 (이 리스트 밖 도구 절대 추천 금지)',
    championsItems
      .filter((item) => !item.isMega)
      .map((item) => `- ${item.ko}`)
      .join('\n'),
    '',
    '## 요청',
    "- summary는 한 줄 결론. 핵심 강점·약점만 명사구 위주. 만연체·풀이·근거 나열 금지 (예: '특수 화력 우위, 얼음·페어리 4약점')",
    '- 각 details.text는 한 문장에 한 포인트만, 40자 이내. 같은 kind에 포인트가 여럿이면 entry를 여러 개로 쪼개라',
    "- 만연체·접속사 남발·부연 설명 금지. 한국 SV 커뮤니티 어휘 (예: '얼음 약점 누적', '선제 압박', '내구 부족')",
    "- 메가스톤 보유 포켓몬이 2마리 이상이면 warning 또는 recommendation 카드에 어느 포켓몬의 메가스톤이 잉여인지·대체 도구 후보를 한 문장씩 (포켓몬 종족명 그대로 사용, '슬롯 1·2번' 같은 표현 금지)",
    "- 대체 도구 추천은 반드시 위 '챔피언스 도구 카탈로그'에 한국어명 그대로 있는 항목만. '수명구'·'이상한사탕'·'독계열강화도구' 같은 카탈로그 밖 명칭/총칭 추천 절대 금지",
    '- 상위 카운터와 우리 파티가 막을 수 있는 픽도 한 문장씩 짧게',
    '- 위 정적 분석은 이미 계산된 값이니 재계산하지 말고 해석에만 집중',
    '- 응답 마지막에 표준 JSON 코드블록을 반드시 포함',
  ].join('\n');
};

const battleDecisionBody = (state: BattleState): string => {
  const lines: string[] = [];
  lines.push('');
  lines.push(`## 현재 턴: ${state.turn}`);
  if (state.weather) lines.push(`- 날씨: ${state.weather}`);
  if (state.terrain) lines.push(`- 필드: ${state.terrain}`);
  if (state.trickRoom) lines.push(`- 트릭룸: 활성`);
  const fld = state.battleField;
  if (fld) {
    const notes: string[] = [];
    if (fld.myStealthRock) notes.push('내 진영 스텔스록');
    if (fld.mySpikes > 0) notes.push(`내 진영 압정 ${fld.mySpikes}층`);
    if (fld.myStickyWeb) notes.push('내 진영 끈적네트');
    if (fld.opponentLightScreen) notes.push('상대 빛의장막(특수 반감)');
    if (fld.opponentReflect) notes.push('상대 리플렉터(물리 반감)');
    if (fld.myTailwind) notes.push('내 순풍(스피드 2배)');
    if (fld.opponentTailwind) notes.push('상대 순풍');
    if (notes.length > 0) {
      lines.push(`- 필드 상태: ${notes.join(', ')} (위 데미지·타수에 이미 반영됨. 교체 시 내 진영 진입 위험 고려)`);
    }
  }
  lines.push('');
  lines.push('## 내 파티');
  lines.push(state.my.map(formatMember).join('\n'));
  lines.push('');
  lines.push('## 상대 공개분');
  const revealedSpecies = state.opponent.revealed
    .map((member) => member.species)
    .filter((species): species is string => Boolean(species));
  if (revealedSpecies.length === 0) {
    lines.push('(공개된 정보 없음)');
  } else {
    lines.push(revealedSpecies.join(', '));
    for (const species of revealedSpecies) {
      const hint = opponentSetHint(species);
      if (hint) {
        const abilities = hint.abilities.length > 0 ? hint.abilities.join('/') : '불명';
        const moves = hint.moves.length > 0 ? hint.moves.join(', ') : '불명';
        lines.push(`- ${species} 예상: 특성 ${abilities} / 기술 ${moves}`);
      }
    }
  }

  const mySlot = state.myField[0];
  const opponentSlot = state.opponent.field[0];
  const myActive = mySlot?.member;
  if (myActive && mySlot && opponentSlot) {
    const pickRanks = (ranks: { A: number; B: number; C: number; D: number; S: number }) => ({
      A: ranks.A,
      B: ranks.B,
      C: ranks.C,
      D: ranks.D,
      S: ranks.S,
    });
    const myMega = mySlot.megaForm
      ? findMegasBySpecies(myActive.species).find((m) => m.form === mySlot.megaForm)
      : undefined;
    const opponentMega = opponentSlot.megaForm
      ? findMegasBySpecies(opponentSlot.member.species).find((m) => m.form === opponentSlot.megaForm)
      : undefined;
    const options = moveOptions(myActive, opponentSlot.member.species, opponentSlot.hpPercent, {
      mega: myMega,
      opponentMega,
      myRanks: pickRanks(mySlot.ranks),
      opponentRanks: pickRanks(opponentSlot.ranks),
      myStatus: mySlot.status ?? '',
      opponentScreens: state.battleField
        ? { light: state.battleField.opponentLightScreen, reflect: state.battleField.opponentReflect }
        : undefined,
    });
    if (options) {
      const oppRankNote = opponentSlot.ranks.D !== 0 || opponentSlot.ranks.B !== 0 ? ' (상대 랭크 반영)' : '';
      lines.push('');
      lines.push(
        `## 내 액티브 기술 옵션 (${myMega ? '메가 ' : ''}${myActive.species} → ${opponentMega ? '메가 ' : ''}${opponentSlot.member.species} HP ${opponentSlot.hpPercent}%${oppRankNote})`,
      );
      for (const option of options) {
        lines.push(
          option.damaging
            ? `- ${option.move} (${option.type}/${option.category} ${option.power}): ${option.min}~${option.max}, ${option.hitsText}, 1HKO ${Math.round(option.koChance * 100)}% (16롤 중 ${Math.round(option.koChance * 16)})`
            : `- ${option.move} (${option.category}): 변화/비데미지`,
        );
      }
    }
  }

  lines.push('');
  lines.push('## 요청');
  lines.push('- 다음 턴 옵션(기술 vs 교체)을 추천하고 각 옵션의 데미지·확률을 제시');
  lines.push(
    '- 위 데미지·타수·1HKO 확률은 상대 랭크업·메가·내 상태이상이 이미 반영된 값이다. 재계산하지 말고 그대로 인용하라',
  );
  lines.push(
    "- '1HKO 확률'은 한 방에 쓰러뜨릴 확률이다. '확정 N타'는 그 타수만에 반드시 쓰러진다는 뜻이니, 1HKO 0% + 확정 2타면 '한 방은 안 되지만 두 번에 확실히 잡음'으로 해석하라. 두 수치를 모순처럼 섞지 말 것",
  );
  lines.push('- 응답 마지막에 표준 JSON 코드블록을 반드시 포함');
  return lines.join('\n');
};

const resolveMegaMap = (formBySpecies?: Record<string, string>): Map<string, MegaForm> => {
  const map = new Map<string, MegaForm>();
  if (!formBySpecies) {
    return map;
  }
  for (const [species, form] of Object.entries(formBySpecies)) {
    if (!form) {
      continue;
    }
    const mega = findMegasBySpecies(species).find((m) => m.form === form);
    if (mega) {
      map.set(species, mega);
    }
  }
  return map;
};

export type MegaFormSelection = {
  my?: Record<string, string>;
  opponent?: Record<string, string>;
};

const matchupLeadBody = (state: BattleState, megaForms?: MegaFormSelection): string => {
  const opponents = state.opponent.revealed
    .map((member) => member.species)
    .filter((species): species is string => Boolean(species));
  const context: MatchupContext = {
    myMegaByPick: resolveMegaMap(megaForms?.my),
    opponentMegaBySpecies: resolveMegaMap(megaForms?.opponent),
  };
  const board = leadBoard(state.my, opponents, context);
  const cover = coverage(state.my, opponents, context);
  const boardLines = board.map((lead, index) => {
    const detail = lead.pairs.map((pair) => `${pair.opponent} ${pair.verdict}`).join(', ');
    return `- ${index + 1}순위 ${lead.myPick}: ${lead.finalScore}점 (유리 ${lead.favorable}/불리 ${lead.unfavorable})${detail ? ` — ${detail}` : ''}`;
  });
  const lineupPriorityLabel = (priority: string | undefined): string =>
    priority === 'obligatory'
      ? '메가 필수'
      : priority === 'flexible'
        ? '비메가도 유효'
        : priority === 'fringe'
          ? '비주류'
          : '데이터 없음';
  const megaCarriersInLineup = state.my
    .map((member) => ({ member, mega: member.item ? findMegaByItem(member.item) : undefined }))
    .filter((entry) => entry.mega !== undefined)
    .map((entry) => `${entry.member.species}(${entry.member.item}) [${lineupPriorityLabel(entry.mega!.megaPriority)}]`);
  const megaLineupLine =
    megaCarriersInLineup.length === 0
      ? '- 선출 내 메가스톤: 없음'
      : `- 선출 내 메가스톤: ${megaCarriersInLineup.length}개 (${megaCarriersInLineup.join(', ')})`;

  return [
    '',
    '## 선출 3마리',
    state.my.map(formatMember).join('\n'),
    '',
    '## 상대 공개분',
    opponents.length === 0 ? '(공개된 정보 없음)' : opponents.join(', '),
    ...opponents
      .map((species) => {
        const hint = opponentSetHint(species);
        if (!hint) {
          return undefined;
        }
        const abilities = hint.abilities.length > 0 ? hint.abilities.join('/') : '불명';
        const moves = hint.moves.length > 0 ? hint.moves.join(', ') : '불명';
        return `- ${species} 예상: 특성 ${abilities} / 기술 ${moves}`;
      })
      .filter((line): line is string => line !== undefined),
    '',
    '## 결정론 순위 (모델이 뒤집지 말 것)',
    `- 상대 커버리지: ${cover.covered}/${cover.total}`,
    ...(boardLines.length > 0 ? boardLines : ['- (상대 공개분 없음)']),
    megaLineupLine,
    '',
    '## 챔피언스 룰 메모',
    '- 한 배틀에 메가진화는 1마리만 가능. 선출 내 메가스톤이 2개 이상이면 한쪽은 사용 불가.',
    "- 위 [라벨]은 Smogon 챔피언스 사용률 기반 메가 의무도. '메가 필수' 픽을 메인 메가로 두고, '비메가도 유효'·'비주류' 픽은 비메가로 운용하라고 안내.",
    '',
    '## 요청',
    "- summary는 한 줄로 1·2·3순위만 적어라. 예: '1순위 누리레느, 2순위 한카리아스, 3순위 킬라플로르'. 풀이·근거·만연체 금지",
    '- 순위는 위 결정론 계산을 그대로 따른다. 다른 순서로 뒤집지 말 것',
    '- 선출 내 메가스톤이 2개 이상이면, 누가 메가를 쓰는 게 유리한지를 1순위 픽의 details (recommendation 또는 warning)로 짚어라',
    "- details는 픽별로 작성. 각 entry의 target은 픽 종족명만(예: '누리레느'). '(선두 1순위)' 같은 접미어·괄호 금지",
    '- 각 details.text는 한 문장 한 포인트만. 같은 픽 같은 kind에 포인트가 여럿이면 entry를 여러 개로 쪼개라',
    '- kind=strength는 장점, weakness는 단점, warning은 주의, recommendation은 운용 팁(선두 뒤 교체 타이밍 등)에 사용',
    '- 응답 마지막에 표준 JSON 코드블록을 반드시 포함',
  ].join('\n');
};

export const serializeForClaude = (
  task: ExportTask,
  payload: { party?: Party; state?: BattleState; megaForms?: MegaFormSelection },
): string => {
  const header = TASK_HEADERS[task];
  let body: string;

  if (task === 'party-analysis') {
    if (!payload.party) {
      throw new Error('party-analysis는 party가 필요하다');
    }
    body = partyAnalysisBody(payload.party);
  } else if (task === 'battle-decision') {
    if (!payload.state) {
      throw new Error('battle-decision은 state가 필요하다');
    }
    body = battleDecisionBody(payload.state);
  } else {
    if (!payload.state) {
      throw new Error('matchup-leadrec은 state가 필요하다');
    }
    body = matchupLeadBody(payload.state, payload.megaForms);
  }

  return [header, body].join('\n');
};
