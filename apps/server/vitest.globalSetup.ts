import { MikroORM } from "@mikro-orm/core";

import mikroOrmConfig from "./src/mikro-orm.config";

// 테스트 실행 전 1회: 테스트 DB 존재 보장 + 스키마 동기화. Postgres(test)가 떠 있어야 한다
// (`mise run infra up --env test`). 각 테스트의 격리는 트랜잭션 롤백으로 한다.
export async function setup(): Promise<void> {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.schema.ensureDatabase();
  await orm.schema.update();
  await orm.close();
}
