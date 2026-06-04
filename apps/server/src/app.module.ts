import { MikroORM } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module, type OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AdvisorModule } from "./advisor/advisor.module";
import { AuthModule } from "./auth/auth.module";
import { BattleModule } from "./battle/battle.module";
import { HealthController } from "./health/health.controller";
import { ImportModule } from "./import/import.module";
import mikroOrmConfig, { getEnvFilePath, isProduction } from "./mikro-orm.config";
import { PresetsModule } from "./presets/presets.module";
import { QuotaModule } from "./quota/quota.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: getEnvFilePath() }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    UsersModule,
    AuthModule,
    PresetsModule,
    QuotaModule,
    AdvisorModule,
    BattleModule,
    ImportModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly orm: MikroORM) {}

  // 개발·테스트에선 스키마를 자동 동기화한다. 운영은 마이그레이션(migration:up)으로 관리.
  async onModuleInit(): Promise<void> {
    if (!isProduction()) {
      await this.orm.schema.update();
    }
  }
}
