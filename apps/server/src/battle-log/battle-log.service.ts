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

export type MetaLeadRecord = { species: string; games: number; wins: number; winRate: number; usage: number };
export type MetaGimmickRecord = { gimmick: string; games: number; share: number };
export type MetaSummary = {
  totalGames: number;
  topLeads: MetaLeadRecord[];
  topOpponents: MetaLeadRecord[];
  gimmickUsage: MetaGimmickRecord[];
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

  // 전체 사용자 대전 로그를 집계해 리빙 메타 요약을 반환한다. 유저 식별자는 포함하지 않는다.
  async meta(limit = 15): Promise<MetaSummary> {
    const logs = await this.em.find(BattleLog, {});
    const totalGames = logs.length;

    if (totalGames === 0) {
      return { totalGames: 0, topLeads: [], topOpponents: [], gimmickUsage: [] };
    }

    const tally = (keyOf: (log: BattleLog) => string): Map<string, { games: number; wins: number }> => {
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
      return map;
    };

    const toMetaRecords = (map: Map<string, { games: number; wins: number }>): MetaLeadRecord[] =>
      [...map.entries()]
        .map(([species, { games, wins }]) => ({
          species,
          games,
          wins,
          winRate: winRate(wins, games),
          usage: Math.round((games / totalGames) * 1000) / 10,
        }))
        .sort((a, b) => b.games - a.games)
        .slice(0, limit);

    const gimmickMap = new Map<string, number>();
    for (const log of logs) {
      gimmickMap.set(log.gimmick, (gimmickMap.get(log.gimmick) ?? 0) + 1);
    }
    const gimmickUsage: MetaGimmickRecord[] = [...gimmickMap.entries()].map(([gimmick, games]) => ({
      gimmick,
      games,
      share: Math.round((games / totalGames) * 1000) / 10,
    }));

    return {
      totalGames,
      topLeads: toMetaRecords(tally((log) => log.myLead)),
      topOpponents: toMetaRecords(tally((log) => log.opponentLead)),
      gimmickUsage,
    };
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
