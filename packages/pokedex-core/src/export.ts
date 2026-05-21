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

const partyAnalysisBody = (party: Party): string =>
  [
    "",
    "## 파티",
    party.map(formatMember).join("\n"),
    "",
    "## 요청",
    "- 이 파티의 장점과 약점을 한국 SV 커뮤니티 어휘로 분석",
    "- 견제가 필요한 상위 카운터와, 우리 파티가 막을 수 있는 픽 정리",
    "- 보완할 슬롯이 있다면 슬롯 번호와 함께 제안",
    "- 응답 마지막에 표준 JSON 코드블록을 반드시 포함",
  ].join("\n");

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
  else lines.push(JSON.stringify(state.opponent.revealed, null, 2));
  lines.push("");
  lines.push("## 요청");
  lines.push("- 다음 턴 옵션(기술 vs 교체)을 추천하고 각 옵션의 데미지·확률을 제시");
  lines.push("- 응답 마지막에 표준 JSON 코드블록을 반드시 포함");
  return lines.join("\n");
};

const matchupLeadBody = (state: BattleState): string =>
  [
    "",
    "## 내 파티",
    state.my.map(formatMember).join("\n"),
    "",
    "## 상대 공개분",
    state.opponent.revealed.length === 0
      ? "(공개된 정보 없음)"
      : JSON.stringify(state.opponent.revealed, null, 2),
    "",
    "## 요청",
    "- 선두로 낼 후보의 우선순위와 각 선택의 근거",
    "- 상대의 예상 응수 (가능성 높은 순)",
    "- 응답 마지막에 표준 JSON 코드블록을 반드시 포함",
  ].join("\n");

export const serializeForClaude = (
  task: ExportTask,
  payload: { party?: Party; state?: BattleState }
): string => {
  const header = TASK_HEADERS[task];
  let body = "";
  let dataBlock: unknown = {};

  if (task === "party-analysis") {
    if (!payload.party) throw new Error("party-analysis는 party가 필요하다");
    body = partyAnalysisBody(payload.party);
    dataBlock = { task, party: payload.party };
  } else if (task === "battle-decision") {
    if (!payload.state) throw new Error("battle-decision은 state가 필요하다");
    body = battleDecisionBody(payload.state);
    dataBlock = { task, state: payload.state };
  } else {
    if (!payload.state) throw new Error("matchup-leadrec은 state가 필요하다");
    body = matchupLeadBody(payload.state);
    dataBlock = { task, state: payload.state };
  }

  return [
    header,
    body,
    "",
    "## 원본 데이터 (참조용)",
    "```json",
    JSON.stringify(dataBlock, null, 2),
    "```",
  ].join("\n");
};
