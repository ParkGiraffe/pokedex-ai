import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

// 배틀 스크린샷 조언은 경량 Sonnet 비전. OCR(Opus)과 달리 실시간 한 수 조언용으로 max_tokens도 작게.
const MODEL = process.env.ADVISOR_MODEL_BATTLE_VISION ?? 'claude-sonnet-4-6';

const SYSTEM = [
  '포켓몬 챔피언스 싱글배틀 실시간 코치. 배틀 화면 스크린샷을 읽고 이번 턴 한 수를 조언한다.',
  '한국 SV 커뮤니티 어휘만 쓴다(영어 음역·직역 금지). 화면에 보이는 한국어 종족·기술·도구명을 그대로 옮긴다.',
  '화면에서 읽어라: 내 활성 포켓몬·상대 활성 포켓몬·양쪽 남은 HP·날씨/필드·내 기술(보이면)·메가/테라 사용 가능 여부.',
  '화면이 배틀 상황이 아니거나 정보가 불충분하면 readable=false로 두고 무엇이 안 보이는지 situation에 적어라.',
  '고유명사를 지어내지 마라. 화면에 없는 상대 특성·기술은 모르는 정보다 — 추측해서 단정하지 마라.',
  'recommendation은 이번 턴 행동(기술/교체/기믹) 하나로 명확히. 근거(상성·KO 가능성·선후공)를 짧게 덧붙여라.',
  'options에는 고려할 만한 대안 1~3개(action=행동, detail=이유). cautions에는 주의할 상대 변수. 문장부호는 마침표·쉼표만.',
].join('\n');

const AdviceSchema = z.object({
  readable: z.boolean(),
  situation: z.string(),
  recommendation: z.string(),
  options: z.array(z.object({ action: z.string(), detail: z.string() })),
  cautions: z.array(z.string()),
});
export type BattleVisionAdvice = z.infer<typeof AdviceSchema>;

const MEDIA_PREFIX = /^data:(image\/[a-zA-Z+]+);base64,/;
const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type MediaType = (typeof ALLOWED_MEDIA)[number];

const mediaTypeOf = (source: string): MediaType => {
  const detected = MEDIA_PREFIX.exec(source)?.[1];
  return (ALLOWED_MEDIA as readonly string[]).includes(detected ?? '') ? (detected as MediaType) : 'image/jpeg';
};

@Injectable()
export class BattleVisionService {
  // 타임아웃 없으면 Claude API가 hang할 때 요청이 무한 대기한다.
  private readonly anthropic = new Anthropic({ timeout: 90_000 });

  async adviseFromScreenshot(source: string, note?: string): Promise<BattleVisionAdvice> {
    const mediaType = mediaTypeOf(source);
    const data = source.replace(MEDIA_PREFIX, '');
    const userText = note?.trim() ? `참고 메모: ${note.trim()}` : '이 배틀 화면을 읽고 다음 한 수를 조언하라.';
    try {
      const response = await this.anthropic.messages.parse({
        model: MODEL,
        max_tokens: 1200,
        system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
              { type: 'text', text: userText },
            ],
          },
        ],
        output_config: { format: zodOutputFormat(AdviceSchema) },
      });
      const parsed = response.parsed_output;
      if (!parsed) {
        throw new Error('Claude 응답이 스키마에 맞지 않음');
      }
      return parsed;
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) {
        throw new Error('Claude API 인증 실패 — ANTHROPIC_API_KEY 환경변수 확인', { cause: error });
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new Error('Claude API 한도 초과 — 잠시 후 재시도', { cause: error });
      }
      throw error;
    }
  }
}
