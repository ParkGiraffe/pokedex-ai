import { type PartyDraft } from '@pokedex-agent/pokedex-core';

import { apiRequest } from '@/features/auth';

export type PresetRes = {
  id: string;
  name: string;
  party: PartyDraft;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SharedPresetRes = {
  name: string;
  party: PartyDraft;
};

export const fetchPresets = (): Promise<PresetRes[]> => apiRequest('/presets', { method: 'GET' }, '프리셋 조회 실패');

export const createPreset = (body: { name: string; party: PartyDraft }): Promise<PresetRes> =>
  apiRequest('/presets', { method: 'POST', body: JSON.stringify(body) }, '프리셋 저장 실패');

export const deletePreset = (id: string): Promise<void> =>
  apiRequest(`/presets/${id}`, { method: 'DELETE' }, '프리셋 삭제 실패');

export const sharePreset = (id: string): Promise<{ shareToken: string }> =>
  apiRequest(`/presets/${id}/share`, { method: 'POST' }, '공유 실패');

export const unsharePreset = (id: string): Promise<void> =>
  apiRequest(`/presets/${id}/share`, { method: 'DELETE' }, '공유 취소 실패');

// 공개 조회 — 토큰만 있으면 비로그인도 호출 가능(서버가 가드 없이 받는다).
export const fetchSharedPreset = (token: string): Promise<SharedPresetRes> =>
  apiRequest(`/shared-presets/${encodeURIComponent(token)}`, { method: 'GET' }, '공유된 프리셋을 찾을 수 없습니다');
