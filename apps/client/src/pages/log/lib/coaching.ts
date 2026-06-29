import { type BattleStatsRes } from '@/features/battle-log/api';

const MIN_GAMES = 3;
const WEAK_RATE = 50;
const STRONG_RATE = 60;

export type OpponentInsight = { opponent: string; games: number; wins: number; winRate: number };
export type LeadInsight = { lead: string; games: number; wins: number; winRate: number };

export type Coaching = {
  weakOpponents: OpponentInsight[];
  weakLeads: LeadInsight[];
  strongLeads: LeadInsight[];
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
