import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { QuotaModule } from '../quota/quota.module';
import { AdvisorController } from './advisor.controller';
import { AdvisorService } from './advisor.service';

@Module({
  imports: [AuthModule, QuotaModule],
  controllers: [AdvisorController],
  providers: [AdvisorService],
})
export class AdvisorModule {}
