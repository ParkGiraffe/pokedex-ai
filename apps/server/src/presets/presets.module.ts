import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { Preset } from './preset.entity';
import { PresetsController } from './presets.controller';
import { PresetsService } from './presets.service';

@Module({
  imports: [MikroOrmModule.forFeature([Preset]), AuthModule],
  controllers: [PresetsController],
  providers: [PresetsService],
})
export class PresetsModule {}
