import { EntityManager } from '@mikro-orm/postgresql';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';

import { UserTier } from '../users/user.enums';
import { UsersService } from '../users/users.service';
import { QUOTA_CAP_BY_TIER } from './quota-caps';
import { UsageDaily } from './usage-daily.entity';

export type QuotaStatus = { used: number; remaining: number; cap: number };

@Injectable()
export class QuotaService {
  constructor(
    private readonly em: EntityManager,
    private readonly users: UsersService,
  ) {}

  private today(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  }

  private async consume(userId: string, cap: number): Promise<number | null> {
    const rows = await this.em.getConnection().execute<Array<{ count: number }>>(
      `insert into usage_daily (user_id, usage_date, count) values (?, ?, 1)
       on conflict (user_id, usage_date) do update set count = usage_daily.count + 1
       where usage_daily.count < ?
       returning count`,
      [userId, this.today(), cap],
    );
    return rows[0]?.count ?? null;
  }

  async consumeOrThrow(userId: string): Promise<void> {
    const cap = await this.capOf(userId);
    if ((await this.consume(userId, cap)) === null) {
      throw new HttpException(`오늘 질의 한도(${cap}회)를 모두 사용했습니다`, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async status(userId: string): Promise<QuotaStatus> {
    const cap = await this.capOf(userId);
    const row = await this.em.findOne(UsageDaily, { userId, usageDate: this.today() });
    const used = row?.count ?? 0;
    return { used, remaining: Math.max(0, cap - used), cap };
  }

  private async capOf(userId: string): Promise<number> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }
    return QUOTA_CAP_BY_TIER[user.tier as UserTier];
  }
}
