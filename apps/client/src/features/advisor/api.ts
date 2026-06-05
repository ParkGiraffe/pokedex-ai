import type { BattleState, ClaudeResponse, Party } from '@pokedex-agent/pokedex-core';

import { apiRequest } from '@/features/auth';

// AI 엔드포인트는 로그인 + 일일 쿼터 게이트가 걸려 있어 토큰을 붙여 호출한다(apiRequest가 처리).
// 401(미로그인)·429(한도 초과)는 서버 { error } 메시지가 그대로 throw된다.

export const requestPartyAnalysis = (party: Party): Promise<ClaudeResponse> =>
  apiRequest('/analyze-party', { method: 'POST', body: JSON.stringify({ party }) }, '파티 분석 실패');

export type MegaFormSelection = {
  my?: Record<string, string>;
  opponent?: Record<string, string>;
};

export const requestMatchupLeadrec = (state: BattleState, megaForms?: MegaFormSelection): Promise<ClaudeResponse> =>
  apiRequest('/matchup-leadrec', { method: 'POST', body: JSON.stringify({ state, megaForms }) }, '매치업 분석 실패');

export const requestBattleAdvice = (state: BattleState): Promise<ClaudeResponse> =>
  apiRequest('/battle-advice', { method: 'POST', body: JSON.stringify({ state }) }, '배틀 추천 실패');

export type ImportMember = {
  species: string;
  ability: string;
  item: string;
  nature: string;
  teraType: string;
  moves: [string, string, string, string];
  evs: Record<'H' | 'A' | 'B' | 'C' | 'D' | 'S', number>;
};

export type ImportResult = { party: ImportMember[]; warnings: string[] };

// 파티 화면 이미지 여러 장(base64 data URL) → 서버 비전 분석·병합 → 검증된 파티
export const importPartyImages = (images: string[]): Promise<ImportResult> =>
  apiRequest('/import-party', { method: 'POST', body: JSON.stringify({ images }) }, '이미지 분석 실패');
