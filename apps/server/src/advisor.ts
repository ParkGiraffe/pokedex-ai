import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  type BattleState,
  ClaudeResponseSchema,
  type ClaudeResponse,
  type ExportTask,
  type Party,
  serializeForClaude,
} from "@pokedex-agent/pokedex-core";

// 추천 시스템 전용 모델 — 응답 속도 우선 Sonnet. OCR(import.ts)은 별도로 Opus 유지.
const ADVISOR_MODEL = process.env.ADVISOR_MODEL ?? "claude-sonnet-4-6";
const anthropic = new Anthropic();

const SYSTEM = [
  "포켓몬 챔피언스 싱글배틀 분석가다.",
  "한국 SV 커뮤니티 어휘를 사용한다 — 영어 직역(메이저 위협·티어 리스트 등)은 금지.",
  "근거(상성·수치·메타)와 함께 추천하고 단정형 표현(확실히 패배 등)은 쓰지 말 것.",
  "응답은 짧고 압축적으로: details는 파티 전체 관점 2~4개만 (포켓몬별로 한 마디씩 나열 금지). 한 카드에 들어갈 분량.",
  "details.kind는 strength·weakness 위주, target은 '파티 전체' 또는 핵심 슬롯 번호 한정.",
  "응답의 task 필드는 호출자가 지정한 값으로 정확히 채운다.",
].join("\n");

const request = async (task: ExportTask, payload: { party?: Party; state?: BattleState }): Promise<ClaudeResponse> => {
  const body = serializeForClaude(task, payload);
  try {
    const response = await anthropic.messages.parse({
      model: ADVISOR_MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: body }],
      output_config: { format: zodOutputFormat(ClaudeResponseSchema) },
    });
    const parsed = response.parsed_output;
    if (!parsed) {
      throw new Error("Claude 응답이 ClaudeResponse 스키마에 맞지 않음");
    }
    return { ...parsed, task };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new Error("Claude API 인증 실패 — ANTHROPIC_API_KEY 환경변수 확인");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new Error("Claude API 한도 초과 — 잠시 후 재시도");
    }
    throw error;
  }
};

export const adviseParty = (party: Party): Promise<ClaudeResponse> => request("party-analysis", { party });
export const adviseMatchup = (state: BattleState): Promise<ClaudeResponse> => request("matchup-leadrec", { state });
export const adviseBattle = (state: BattleState): Promise<ClaudeResponse> => request("battle-decision", { state });
