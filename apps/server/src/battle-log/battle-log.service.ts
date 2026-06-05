import { EntityManager } from '@mikro-orm/postgresql';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { User } from '../users/user.entity';
import { BattleLog } from './battle-log.entity';
import { MAX_BATTLE_LOGS } from './battle-log-cap';
import { type CreateBattleLogInput } from './dto';

export type LeadRecord = { lead: string; games: number; wins: number; winRate: number };
export type OpponentRecord = { opponent: string; games: number; wins: number; winRate: number };
export type BattleStats = {
  total: number;
  wins: number;
  winRate: number;
  byLead: LeadRecord[];
  vsOpponent: OpponentRecord[];
};

// 승률은 백분율(소수 1자리)로 돌려준다. 0판이면 0.
const winRate = (wins: number, games: number): number => (games > 0 ? Math.round((wins / games) * 1000) / 10 : 0);

@Injectable()
export class BattleLogService {
  constructor(private readonly em: EntityManager) {}

  list(userId: string): Promise<BattleLog[]> {
    return this.em.find(BattleLog, { user: userId }, { orderBy: { playedAt: 'desc' } });
  }

  // 소유자 본인 것만 — 남의 로그는 존재 여부도 노출하지 않도록 404.
  async getOwned(userId: string, id: string): Promise<BattleLog> {
    const log = await this.em.findOne(BattleLog, { id, user: userId });
    if (!log) {
      throw new NotFoundException('배틀 로그를 찾을 수 없습니다');
    }
    return log;
  }

  // 개수 검사 + 생성을 한 트랜잭션으로 묶어 backstop 상한을 넘기지 못하게 한다.
  create(userId: string, input: CreateBattleLogInput): Promise<BattleLog> {
    return this.em.transactional(async (em) => {
      const user = await em.findOne(User, { id: userId });
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }
      if ((await em.count(BattleLog, { user: userId })) >= MAX_BATTLE_LOGS) {
        throw new ForbiddenException(`배틀 로그는 최대 ${MAX_BATTLE_LOGS}개까지 저장할 수 있습니다`);
      }
      const log = em.create(BattleLog, {
        user,
        playedAt: input.playedAt ? new Date(input.playedAt) : new Date(),
        myLead: input.myLead,
        opponentLead: input.opponentLead,
        gimmick: input.gimmick,
        result: input.result,
        memo: input.memo,
      });
      em.persist(log);
      return log;
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const log = await this.getOwned(userId, id);
    this.em.remove(log);
    await this.em.flush();
  }

  // 전체 승률 + 내 선발별 / 상대 선발별 전적. 개인 규모라 메모리 집계로 충분하다.
  async stats(userId: string): Promise<BattleStats> {
    const logs = await this.em.find(BattleLog, { user: userId });
    const total = logs.length;
    const wins = logs.filter((log) => log.result === 'win').length;

    const tally = (keyOf: (log: BattleLog) => string): Array<{ name: string; games: number; wins: number }> => {
      const map = new Map<string, { games: number; wins: number }>();
      for (const log of logs) {
        const key = keyOf(log);
        const entry = map.get(key) ?? { games: 0, wins: 0 };
        entry.games += 1;
        if (log.result === 'win') {
          entry.wins += 1;
        }
        map.set(key, entry);
      }
      return [...map.entries()].map(([name, entry]) => ({ name, ...entry })).sort((a, b) => b.games - a.games);
    };

    return {
      total,
      wins,
      winRate: winRate(wins, total),
      byLead: tally((log) => log.myLead).map(({ name, games, wins }) => ({
        lead: name,
        games,
        wins,
        winRate: winRate(wins, games),
      })),
      vsOpponent: tally((log) => log.opponentLead).map(({ name, games, wins }) => ({
        opponent: name,
        games,
        wins,
        winRate: winRate(wins, games),
      })),
    };
  }
}
