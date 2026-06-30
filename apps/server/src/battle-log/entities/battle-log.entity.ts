import { type Opt } from '@mikro-orm/core';
import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { uuidv7 } from 'uuidv7';

import { User } from '../../users/entities';
import { BATTLE_GIMMICKS, BATTLE_RESULTS, type BattleGimmick, type BattleResult } from '../enums';

@Entity({ tableName: 'battle_logs' })
export class BattleLog {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv7();

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

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
