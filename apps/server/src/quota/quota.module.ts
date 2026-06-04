import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { QuotaController } from "./quota.controller";
import { QuotaService } from "./quota.service";
import { UsageDaily } from "./usage-daily.entity";

@Module({
  imports: [MikroOrmModule.forFeature([UsageDaily]), UsersModule, AuthModule],
  controllers: [QuotaController],
  providers: [QuotaService],
  exports: [QuotaService],
})
export class QuotaModule {}
