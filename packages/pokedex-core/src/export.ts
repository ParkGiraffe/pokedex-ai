import { analyzeParty } from "./analysis";
import { moveOptions } from "./decision";
import { coverage, leadBoard } from "./matchup";
import { metaSummary } from "./meta";
import type { BattleState, Party } from "./types";

const TASK_HEADERS = {
  "party-analysis": "## 작업: 파티 분석",
  "matchup-leadrec": "## 작업: 선두 추천",
  "battle-decision": "## 작업: 배틀 의사결정",
} as const;

export type ExportTask = keyof typeof TASK_HEADERS;

const formatMember = (m: Party[number], idx: number): string => {
  const stats = `H${m.evs.H}/A${m.evs.A}/B${m.evs.B}/C${m.evs.C}/D${m.evs.D}/S${m.evs.S}`;
  const item = m.item ?? "(없음)";
  return [
    `${idx + 1}. ${m.species} Lv${m.level}`,
    `   특성: ${m.ability} / 도구: ${item} / 성격: ${m.nature} / 테라: ${m.teraType}`,
    `   기술: ${m.moves.join(", ")}`,
    `   EV: ${stats}`,
  ].join("\n");
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
    .join(", ");
  const meta = metaSummary();

  return [
    "",
    "## 파티",
    party.map(formatMember).join("\n"),
    "",
    "## 정적 분석 (이미 계산된 값, 재계산 불필요)",
    `- 약점 분산 점수: ${analysis.synergy.dispersionScore}/100 (피크 ${analysis.synergy.sharedWeaknessPeak}슬롯)`,
    analysis.synergy.stackedTypes.length > 0
      ? `- 누적 약점(3슬롯 이상): ${analysis.synergy.stackedTypes.join(", ")}`
      : "- 누적 약점(3슬롯 이상): 없음",
    "- 타입별 약점 슬롯 수:",
    ...(weakLines.length > 0 ? weakLines : ["  - 없음"]),
    `- 역할 분포: ${roleLine || "없음"}`,
    `- 화력 합계: 물리 ${analysis.balance.physicalPower}, 특수 ${analysis.balance.specialPower}, 내구 ${analysis.balance.bulk}, 최고스피드 ${analysis.balance.topSpeed}`,
    `- 메타: ${meta ?? "미수집"}`,
    "",
    "## 요청",
    "- 이 파티의 장점과 약점을 한국 SV 커뮤니티 어휘로 분석",
    "- 견제가 필요한 상위 카운터와, 우리 파티가 막을 수 있는 픽 정리",
    "- 보완할 슬롯이 있다면 슬롯 번호와 함께 제안",
    "- 위 정적 분석은 이미 계산된 값이니 재계산하지 말고 해석에 집중",
    "- 응답 마지막에 표준 JSON 코드블록을 반드시 포함",
  ].join("\n");
};

const battleDecisionBody = (state: BattleState): string => {
  const lines: string[] = [];
  lines.push("");
  lines.push(`## 현재 턴: ${state.turn}`);
  if (state.weather) lines.push(`- 날씨: ${state.weather}`);
  if (state.terrain) lines.push(`- 필드: ${state.terrain}`);
  if (state.trickRoom) lines.push(`- 트릭룸: 활성`);
  lines.push("");
  lines.push("## 내 파티");
  lines.push(state.my.map(formatMember).join("\n"));
  lines.push("");
  lines.push("## 상대 공개분");
  if (state.opponent.revealed.length === 0) lines.push("(공개된 정보 없음)");
  else lines.push(state.opponent.revealed.map((member) => member.species ?? "?").join(", "));

  const myActive = state.myField[0]?.member;
  const opponentActive = state.opponent.field[0];
  if (myActive && opponentActive) {
    const options = moveOptions(myActive, opponentActive.member.species, opponentActive.hpPercent);
    if (options) {
      lines.push("");
      lines.push(
        `## 내 액티브 기술 옵션 (${myActive.species} → ${opponentActive.member.species} HP ${opponentActive.hpPercent}%, 상대 0투자 가정)`
      );
      for (const option of options) {
        lines.push(
          option.damaging
            ? `- ${option.move} (${option.type}/${option.category} ${option.power}): ${option.min}~${option.max}, KO ${Math.round(option.koChance * 100)}% (16롤 중 ${Math.round(option.koChance * 16)})`
            : `- ${option.move} (${option.category}): 변화/비데미지`
        );
      }
    }
  }

  lines.push("");
  lines.push("## 요청");
  lines.push("- 다음 턴 옵션(기술 vs 교체)을 추천하고 각 옵션의 데미지·확률을 제시");
  lines.push("- KO 확률은 16롤 기준이니 확신처럼 단정하지 말 것");
  lines.push("- 응답 마지막에 표준 JSON 코드블록을 반드시 포함");
  return lines.join("\n");
};

const matchupLeadBody = (state: BattleState): string => {
  const opponents = state.opponent.revealed
    .map((member) => member.species)
    .filter((species): species is string => Boolean(species));
  // state.my는 호출자가 이미 선출한 3마리만 담아 전달한다. leadBoard는 그 안에서 1·2·3순위를 결정.
  const board = leadBoard(state.my, opponents);
  const cover = coverage(state.my, opponents);
  const boardLines = board.map((lead, index) => {
    const detail = lead.pairs.map((pair) => `${pair.opponent} ${pair.verdict}`).join(", ");
    return `- ${index + 1}순위 ${lead.myPick}: ${lead.finalScore}점 (유리 ${lead.favorable}/불리 ${lead.unfavorable})${detail ? ` — ${detail}` : ""}`;
  });

  return [
    "",
    "## 선출 3마리",
    state.my.map(formatMember).join("\n"),
    "",
    "## 상대 공개분",
    opponents.length === 0 ? "(공개된 정보 없음)" : opponents.join(", "),
    "",
    "## 결정론 순위 (모델이 뒤집지 말 것)",
    `- 상대 커버리지: ${cover.covered}/${cover.total}`,
    ...(boardLines.length > 0 ? boardLines : ["- (상대 공개분 없음)"]),
    "",
    "## 요청",
    "- summary는 한 줄로 1·2·3순위만 적어라. 예: '1순위 누리레느, 2순위 한카리아스, 3순위 킬라플로르'. 풀이·근거·만연체 금지",
    "- 순위는 위 결정론 계산을 그대로 따른다. 다른 순서로 뒤집지 말 것",
    "- details는 픽별로 작성. 각 entry의 target은 픽 종족명만(예: '누리레느'). '(선두 1순위)' 같은 접미어·괄호 금지",
    "- 각 details.text는 한 문장 한 포인트만. 같은 픽 같은 kind에 포인트가 여럿이면 entry를 여러 개로 쪼개라",
    "- kind=strength는 장점, weakness는 단점, warning은 주의, recommendation은 운용 팁(선두 뒤 교체 타이밍 등)에 사용",
    "- 응답 마지막에 표준 JSON 코드블록을 반드시 포함",
  ].join("\n");
};

export const serializeForClaude = (
  task: ExportTask,
  payload: { party?: Party; state?: BattleState }
): string => {
  const header = TASK_HEADERS[task];
  let body = "";

  if (task === "party-analysis") {
    if (!payload.party) {
      throw new Error("party-analysis는 party가 필요하다");
    }
    body = partyAnalysisBody(payload.party);
  } else if (task === "battle-decision") {
    if (!payload.state) {
      throw new Error("battle-decision은 state가 필요하다");
    }
    body = battleDecisionBody(payload.state);
  } else {
    if (!payload.state) {
      throw new Error("matchup-leadrec은 state가 필요하다");
    }
    body = matchupLeadBody(payload.state);
  }

  return [header, body].join("\n");
};
