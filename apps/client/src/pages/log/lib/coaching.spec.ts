import { describe, expect, it } from 'vitest';

import { type BattleStatsRes } from '@/features/battle-log';

import { analyzeCoaching } from './coaching';

const stats = (over: Partial<BattleStatsRes> = {}): BattleStatsRes => ({
  total: 10,
  wins: 5,
  winRate: 50,
  byLead: [],
  vsOpponent: [],
  ...over,
});

describe('전적 코칭 분석', () => {
  it('표본이 충분하고 승률이 낮은 상대만 약점으로 잡는다', () => {
    const result = analyzeCoaching(
      stats({
        vsOpponent: [
          { opponent: '마기라스', games: 5, wins: 1, winRate: 20 }, // 약점
          { opponent: '한카리아스', games: 2, wins: 0, winRate: 0 }, // 표본 부족 → 제외
          { opponent: '리자몽', games: 4, wins: 3, winRate: 75 }, // 강세 → 제외
        ],
      }),
    );
    expect(result.weakOpponents).toHaveLength(1);
    expect(result.weakOpponents[0]?.opponent).toBe('마기라스');
  });

  it('약점 상대는 승률 오름차순으로 정렬한다', () => {
    const result = analyzeCoaching(
      stats({
        vsOpponent: [
          { opponent: 'A', games: 4, wins: 1, winRate: 25 },
          { opponent: 'B', games: 5, wins: 0, winRate: 0 },
        ],
      }),
    );
    expect(result.weakOpponents.map((row) => row.opponent)).toEqual(['B', 'A']);
  });

  it('내 선발의 강점·약점을 나눈다', () => {
    const result = analyzeCoaching(
      stats({
        byLead: [
          { lead: '한카리아스', games: 5, wins: 1, winRate: 20 },
          { lead: '리자몽', games: 5, wins: 4, winRate: 80 },
        ],
      }),
    );
    expect(result.weakLeads.map((row) => row.lead)).toEqual(['한카리아스']);
    expect(result.strongLeads.map((row) => row.lead)).toEqual(['리자몽']);
  });

  it('전체 표본이 적으면 데이터 부족으로 표시한다', () => {
    expect(analyzeCoaching(stats({ total: 2 })).hasEnoughData).toBe(false);
    expect(analyzeCoaching(stats({ total: 3 })).hasEnoughData).toBe(true);
  });
});
