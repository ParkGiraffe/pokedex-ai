import { type Opt } from '@mikro-orm/core';
import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { uuidv7 } from 'uuidv7';

import { User } from '../users/user.entity';
import { BATTLE_GIMMICKS, BATTLE_RESULTS, type BattleGimmick, type BattleResult } from './battle-log.enums';

// 사용자가 직접 적는 대전 일지 한 건. 이 앱은 배틀을 돌리지 않으므로 결과는 수동 기록이다.
@Entity({ tableName: 'battle_logs' })
export class BattleLog {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv7();

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  // 대전 일시 — 기본은 등록 시각, 사용자가 바꿀 수 있다.
  @Property()
  playedAt!: Date;

  @Property()
  myLead!: string;

  @Property()
  opponentLead!: string;

  @Enum({ items: () => [...BATTLE_GIMMICKS] })
  gimmick!: BattleGimmick;

  @Enum({ items: () => [...BATTLE_RESULTS] })
  result!: BattleResult;

  @Property({ nullable: true })
  memo?: string;

  @Property({ type: 'datetime', onCreate: () => new Date() })
  createdAt!: Date & Opt;
}
