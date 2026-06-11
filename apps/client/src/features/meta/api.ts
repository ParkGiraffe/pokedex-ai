import { apiRequest } from '@/features/auth';

export type MetaLeadRecord = { species: string; games: number; wins: number; winRate: number; usage: number };
export type MetaGimmickRecord = { gimmick: string; games: number; share: number };
export type MetaSummary = {
  totalGames: number;
  topLeads: MetaLeadRecord[];
  topOpponents: MetaLeadRecord[];
  gimmickUsage: MetaGimmickRecord[];
};

export const fetchMeta = (): Promise<MetaSummary> => apiRequest('/meta/usage', { method: 'GET' }, '메타 조회 실패');
