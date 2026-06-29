import { MikroORM } from "@mikro-orm/core";

import mikroOrmConfig from "./src/mikro-orm.config";

export async function setup(): Promise<void> {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.schema.ensureDatabase();
  await orm.schema.update();
  await orm.close();
}
