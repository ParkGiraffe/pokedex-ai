import { type Opt } from "@mikro-orm/core";
import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { type PartyDraft } from "@pokedex-agent/pokedex-core";
import { uuidv7 } from "uuidv7";

import { User } from "../users/user.entity";

// 저장된 파티 프리셋. 소유자(User)당 개수는 티어로 제한된다(free 2 / paid 20).
@Entity({ tableName: "presets" })
export class Preset {
  @PrimaryKey({ type: "uuid" })
  id: string = uuidv7();

  @ManyToOne(() => User, { deleteRule: "cascade" })
  user!: User;

  @Property()
  name!: string;

  // 빌더 작업 상태(부분 입력 허용)를 그대로 jsonb로 보관 — 적은 만큼 저장·복원된다.
  @Property({ type: "jsonb" })
  party!: PartyDraft;

  @Property({ type: "datetime", onCreate: () => new Date() })
  createdAt!: Date & Opt;

  @Property({ type: "datetime", onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date & Opt;
}
