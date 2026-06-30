import { type Opt } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'usage_daily' })
export class UsageDaily {
  @PrimaryKey()
  userId!: string;

  @PrimaryKey()
  usageDate!: string;

  @Property({ default: 0 })
  count: number & Opt = 0;
}
