import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { Preset } from './preset.entity';
import { PresetsController } from './presets.controller';
import { PresetsService } from './presets.service';
import { SharedPresetsController } from './shared-presets.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Preset]), AuthModule],
  controllers: [PresetsController, SharedPresetsController],
  providers: [PresetsService],
})
export class PresetsModule {}
