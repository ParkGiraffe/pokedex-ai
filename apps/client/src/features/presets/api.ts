import { type PartyDraft } from "@pokedex-agent/pokedex-core";

import { apiRequest } from "@/features/auth";

export type PresetRes = {
  id: string;
  name: string;
  party: PartyDraft;
  createdAt: string;
  updatedAt: string;
};

export const fetchPresets = (): Promise<PresetRes[]> => apiRequest("/presets", { method: "GET" }, "프리셋 조회 실패");

export const createPreset = (body: { name: string; party: PartyDraft }): Promise<PresetRes> =>
  apiRequest("/presets", { method: "POST", body: JSON.stringify(body) }, "프리셋 저장 실패");

export const deletePreset = (id: string): Promise<void> =>
  apiRequest(`/presets/${id}`, { method: "DELETE" }, "프리셋 삭제 실패");
