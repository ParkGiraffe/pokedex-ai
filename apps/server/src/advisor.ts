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

// 추천 시스템 모델은 한국 SV 어휘 정확도 우선으로 모두 Sonnet 4.6 사용.
// (Haiku는 종족·도구·기술 이름을 fabricate하는 사례가 잦았음.)
// OCR(import.ts)은 별도로 Opus 유지.
const MODEL_BY_TASK: Record<ExportTask, string> = {
  "party-analysis": process.env.ADVISOR_MODEL_PARTY ?? "claude-sonnet-4-6",
  "matchup-leadrec": process.env.ADVISOR_MODEL_MATCHUP ?? "claude-sonnet-4-6",
  "battle-decision": process.env.ADVISOR_MODEL_BATTLE ?? "claude-sonnet-4-6",
};
const anthropic = new Anthropic();

const SYSTEM = [
  "포켓몬 챔피언스 싱글배틀 분석가. 한국 SV 커뮤니티 어휘 (영어 직역 금지).",
  "응답은 details 2~4개로 압축, 파티 전체 관점. 포켓몬별 분산 금지.",
  "details.kind는 strength·weakness 위주. 근거(상성·수치) 포함, 단정형 금지. task 필드는 호출자 값.",
  "고유명사(포켓몬 종족·도구·기술·특성)는 절대 만들어내지 마라. 입력에 등장하지 않은 이름이나 확신 없는 한국 명칭을 출력하지 말 것. 필요하면 슬롯 번호('1번', '2번 슬롯')로만 가리켜라.",
].join("\n");

const request = async (task: ExportTask, payload: { party?: Party; state?: BattleState }): Promise<ClaudeResponse> => {
  const body = serializeForClaude(task, payload);
  try {
    const response = await anthropic.messages.parse({
      model: MODEL_BY_TASK[task],
      max_tokens: 1500,
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
