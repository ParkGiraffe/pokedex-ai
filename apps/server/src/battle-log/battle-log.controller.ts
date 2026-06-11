import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { type BattleLog } from './battle-log.entity';
import { BattleLogService, type BattleStats } from './battle-log.service';
import { CreateBattleLogBody, type CreateBattleLogInput } from './dto';

type BattleLogRes = {
  id: string;
  playedAt: Date;
  myLead: string;
  opponentLead: string;
  gimmick: string;
  result: string;
  memo: string | null;
  createdAt: Date;
};

const toRes = (log: BattleLog): BattleLogRes => ({
  id: log.id,
  playedAt: log.playedAt,
  myLead: log.myLead,
  opponentLead: log.opponentLead,
  gimmick: log.gimmick,
  result: log.result,
  memo: log.memo ?? null,
  createdAt: log.createdAt,
});

@Controller('battle-logs')
@UseGuards(JwtAuthGuard)
export class BattleLogController {
  constructor(private readonly battleLogs: BattleLogService) {}

  @Get()
  async list(@CurrentUserId() userId: string): Promise<BattleLogRes[]> {
    return (await this.battleLogs.list(userId)).map(toRes);
  }

  // 'stats'는 고정 경로라 :id 라우트보다 먼저 둔다(여기선 :id GET이 없지만 의도를 명시).
  @Get('stats')
  async stats(@CurrentUserId() userId: string): Promise<BattleStats> {
    return this.battleLogs.stats(userId);
  }

  @Post()
  @HttpCode(201)
  async create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(CreateBattleLogBody)) body: CreateBattleLogInput,
  ): Promise<BattleLogRes> {
    return toRes(await this.battleLogs.create(userId, body));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.battleLogs.remove(userId, id);
  }
}
