import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { QuotaModule } from "../quota/quota.module";
import { ImportController } from "./import.controller";
import { ImportService } from "./import.service";

@Module({
  imports: [AuthModule, QuotaModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
