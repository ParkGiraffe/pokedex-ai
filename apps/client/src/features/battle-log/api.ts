import { apiRequest } from '@/features/auth';

export type BattleGimmick = 'none' | 'mega' | 'tera';
export type BattleResult = 'win' | 'loss';

export type BattleLogRes = {
  id: string;
  playedAt: string;
  myLead: string;
  opponentLead: string;
  gimmick: BattleGimmick;
  result: BattleResult;
  memo: string | null;
  createdAt: string;
};

export type CreateBattleLogBody = {
  myLead: string;
  opponentLead: string;
  gimmick: BattleGimmick;
  result: BattleResult;
  memo?: string;
  playedAt?: string;
};

export type LeadRecord = { lead: string; games: number; wins: number; winRate: number };
export type OpponentRecord = { opponent: string; games: number; wins: number; winRate: number };
export type BattleStatsRes = {
  total: number;
  wins: number;
  winRate: number;
  byLead: LeadRecord[];
  vsOpponent: OpponentRecord[];
};

export const fetchBattleLogs = (): Promise<BattleLogRes[]> =>
  apiRequest('/battle-logs', { method: 'GET' }, '배틀 로그 조회 실패');

export const createBattleLog = (body: CreateBattleLogBody): Promise<BattleLogRes> =>
  apiRequest('/battle-logs', { method: 'POST', body: JSON.stringify(body) }, '배틀 로그 저장 실패');

export const deleteBattleLog = (id: string): Promise<void> =>
  apiRequest(`/battle-logs/${id}`, { method: 'DELETE' }, '배틀 로그 삭제 실패');

export const fetchBattleStats = (): Promise<BattleStatsRes> =>
  apiRequest('/battle-logs/stats', { method: 'GET' }, '통계 조회 실패');
