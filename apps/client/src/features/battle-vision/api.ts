import { apiRequest } from '@/features/auth';

export type BattleVisionAdvice = {
  readable: boolean;
  situation: string;
  recommendation: string;
  options: Array<{ action: string; detail: string }>;
  cautions: string[];
};

export const adviseScreenshot = (body: { image: string; note?: string }): Promise<BattleVisionAdvice> =>
  apiRequest('/battle-screenshot', { method: 'POST', body: JSON.stringify(body) }, '스크린샷 분석 실패');
