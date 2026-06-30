import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { BattleLogController } from './battle-log.controller';
import { BattleLogService } from './battle-log.service';
import { BattleLog } from './entities';
import { MetaController } from './meta.controller';

@Module({
  imports: [MikroOrmModule.forFeature([BattleLog]), AuthModule],
  controllers: [BattleLogController, MetaController],
  providers: [BattleLogService],
})
export class BattleLogModule {}
