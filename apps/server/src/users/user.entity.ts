import { type Opt } from '@mikro-orm/core';
import { Entity, Enum, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { uuidv7 } from 'uuidv7';

import { type ProviderName } from '../auth/domain/identity';
import { UserTier } from './user.enums';

@Entity({ tableName: 'users' })
@Unique({ properties: ['provider', 'providerUserId'] })
export class User {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv7();

  @Enum({ items: () => ['internal', 'kakao', 'naver'] })
  provider!: ProviderName;

  @Property()
  providerUserId!: string;

  @Property({ unique: true, nullable: true })
  email?: string;

  @Property({ nullable: true, hidden: true })
  passwordHash?: string;

  @Property({ nullable: true })
  nickname?: string;

  @Enum({ items: () => UserTier })
  tier: UserTier & Opt = UserTier.FREE;

  @Property({ type: 'datetime', onCreate: () => new Date() })
  createdAt!: Date & Opt;

  @Property({ type: 'datetime', onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date & Opt;
}
