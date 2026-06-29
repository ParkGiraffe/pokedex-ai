import { Controller, Get, HttpCode, Query } from '@nestjs/common';

import { BattleLogService, type MetaSummary } from './battle-log.service';

@Controller('meta')
export class MetaController {
  constructor(private readonly battleLogService: BattleLogService) {}

  @Get('usage')
  @HttpCode(200)
  async usage(@Query('limit') limitParam?: string): Promise<MetaSummary> {
    const limit = Math.min(parseInt(limitParam ?? '15', 10) || 15, 50);
    return this.battleLogService.meta(limit);
  }
}
