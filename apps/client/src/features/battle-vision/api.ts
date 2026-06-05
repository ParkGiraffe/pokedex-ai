import { apiRequest } from '@/features/auth';

export type BattleVisionAdvice = {
  readable: boolean;
  situation: string;
  recommendation: string;
  options: Array<{ action: string; detail: string }>;
  cautions: string[];
};

// 배틀 스크린샷(base64 data URL) → 서버 Sonnet 비전 → 다음 한 수 조언. 로그인 + 쿼터 게이트.
export const adviseScreenshot = (body: { image: string; note?: string }): Promise<BattleVisionAdvice> =>
  apiRequest('/battle-screenshot', { method: 'POST', body: JSON.stringify(body) }, '스크린샷 분석 실패');
