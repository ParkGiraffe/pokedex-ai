import { type Opt } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { type PartyDraft } from '@pokedex-agent/pokedex-core';
import { uuidv7 } from 'uuidv7';

import { User } from '../users/user.entity';

@Entity({ tableName: 'presets' })
export class Preset {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv7();

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @Property()
  name!: string;

  @Property({ type: 'jsonb' })
  party!: PartyDraft;

  @Property({ nullable: true, unique: true })
  shareToken?: string;

  @Property({ default: 0 })
  copyCount: number & Opt = 0;

  @Property({ type: 'datetime', onCreate: () => new Date() })
  createdAt!: Date & Opt;

  @Property({ type: 'datetime', onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date & Opt;
}
