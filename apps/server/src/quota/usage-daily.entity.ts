import { type Opt } from "@mikro-orm/core";
import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";

// 사용자별 일일 사용량. (userId, usageDate) 복합 PK가 원자적 upsert의 유니크 키가 된다.
// usageDate는 KST 기준 YYYY-MM-DD 문자열(자정 리셋을 타임존 흔들림 없이 명시).
@Entity({ tableName: "usage_daily" })
export class UsageDaily {
  @PrimaryKey()
  userId!: string;

  @PrimaryKey()
  usageDate!: string;

  @Property({ default: 0 })
  count: number & Opt = 0;
}
