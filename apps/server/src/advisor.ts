import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  type BattleState,
  ClaudeResponseSchema,
  type ClaudeResponse,
  type ExportTask,
  isKnownTerm,
  type MegaFormSelection,
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
  "고유명사(포켓몬 종족·도구·기술·특성)는 절대 만들어내지 마라. 입력에 등장하지 않은 이름이나 확신 없는 한국 명칭을 출력하지 말 것.",
  "영어 음역·직역 절대 금지. 반드시 한국 정식 명칭만. 예: '샌드스트림'→'모래날림', '스텔스록'→'스텔스록'은 통용되나 '스텔스 록' 띄어쓰기 금지, '로키헬멧'→'울퉁불퉁멧', '드래곤테일'→'용의꼬리', '돌머리 계열'·'돌진계' 같은 애매한 총칭 금지.",
  "상대 포켓몬의 특성·기술은 입력에 없으면 모르는 정보다. 추측해서 단정하지 말 것. 정 필요하면 '예상' 표현을 쓰되, 확신 없는 특성·기술명은 아예 언급하지 마라. 모르는 특성을 지어내느니 '상대 특성 불명'으로 두는 게 낫다.",
  "포켓몬을 가리킬 때는 입력에 적힌 한국어 종족명을 그대로 쓴다. '슬롯 1번', '1번 슬롯', '슬롯 2' 같은 슬롯 번호 표현 절대 금지. 둘 이상이면 종족명을 쉼표로 나열.",
  "문장 부호는 마침표(.)와 쉼표(,)만 사용. 세미콜론(;), 콜론(:) 같은 영문식 부호는 금지. 'A; B' 대신 'A. B' 또는 'A, B'.",
  "actionable.slot 필드는 절대 사용하지 마라(슬롯 번호 표현 금지). 대신 actionable.reason 시작에 대상 포켓몬의 한국어 종족명을 적어라. 예: '망나뇽: 메가진화 중복 해소, 구애스카프로 교체'.",
  "mentionedNames에는 응답(summary·details·actionable)에 등장시킨 모든 포켓몬 종족·기술·특성·도구의 한국 명칭을 빠짐없이 나열하라. 타입명(불꽃·물 등)·일반 명사·수치는 넣지 마라. 이 목록은 명칭 검증에 쓰이므로 정확히 적어야 한다.",
].join("\n");

const callClaude = async (task: ExportTask, body: string): Promise<ClaudeResponse> => {
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
  return parsed;
};

// 2겹 방어: 응답의 mentionedNames를 검증 사전과 대조해 음역·fabricate를 잡는다.
// 사전 밖 명칭이 있으면 그 목록을 주고 1회 교정 재시도. 그래도 남으면 unknownNames로 표시한다.
const request = async (
  task: ExportTask,
  payload: { party?: Party; state?: BattleState; megaForms?: MegaFormSelection }
): Promise<ClaudeResponse> => {
  const body = serializeForClaude(task, payload);
  try {
    let parsed = await callClaude(task, body);
    let unverified = parsed.mentionedNames.filter((name) => !isKnownTerm(name));
    if (unverified.length > 0) {
      const correction = `\n\n## 명칭 교정 요청 (필수)\n다음 명칭은 검증 사전에 없다(음역·직역·오타·미존재 의심): ${unverified.join(", ")}\n정식 한국 명칭으로 바꾸거나, 확신이 없으면 해당 언급을 통째로 삭제하고 응답을 다시 작성하라. mentionedNames도 갱신하라.`;
      const retried = await callClaude(task, body + correction);
      const retriedUnverified = retried.mentionedNames.filter((name) => !isKnownTerm(name));
      // 재시도가 더 깨끗하면 채택.
      if (retriedUnverified.length < unverified.length) {
        parsed = retried;
        unverified = retriedUnverified;
      }
    }
    return {
      ...parsed,
      task,
      unknownNames: [...new Set([...parsed.unknownNames, ...unverified])],
    };
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
export const adviseMatchup = (state: BattleState, megaForms?: MegaFormSelection): Promise<ClaudeResponse> =>
  request("matchup-leadrec", { state, megaForms });
export const adviseBattle = (state: BattleState): Promise<ClaudeResponse> => request("battle-decision", { state });
