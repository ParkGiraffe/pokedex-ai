import { type BattleStatsRes } from '@/features/battle-log/api';

// 통계로 코칭 인사이트를 뽑는 임계값. 표본이 적으면(MIN_GAMES 미만) 판단하지 않는다.
const MIN_GAMES = 3;
const WEAK_RATE = 50; // 승률(%) 이 값 미만이면 약점
const STRONG_RATE = 60; // 이 값 이상이면 강점

export type OpponentInsight = { opponent: string; games: number; wins: number; winRate: number };
export type LeadInsight = { lead: string; games: number; wins: number; winRate: number };

export type Coaching = {
  weakOpponents: OpponentInsight[]; // 상대 선발별 약점(승률 오름차순)
  weakLeads: LeadInsight[]; // 내 선발 중 안 통하는 것
  strongLeads: LeadInsight[]; // 내 선발 중 잘 통하는 것
  hasEnoughData: boolean;
};

export const analyzeCoaching = (stats: BattleStatsRes): Coaching => {
  const qualified = (games: number): boolean => games >= MIN_GAMES;

  const weakOpponents = stats.vsOpponent
    .filter((row) => qualified(row.games) && row.winRate < WEAK_RATE)
    .sort((a, b) => a.winRate - b.winRate);

  const weakLeads = stats.byLead
    .filter((row) => qualified(row.games) && row.winRate < WEAK_RATE)
    .sort((a, b) => a.winRate - b.winRate);

  const strongLeads = stats.byLead
    .filter((row) => qualified(row.games) && row.winRate >= STRONG_RATE)
    .sort((a, b) => b.winRate - a.winRate);

  const hasEnoughData = stats.total >= MIN_GAMES;

  return { weakOpponents, weakLeads, strongLeads, hasEnoughData };
};
