import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  AnalyzePartyBody,
  type AnalyzePartyInput,
  BattleAdviceBody,
  type BattleAdviceInput,
  BattleScreenshotBody,
  type BattleScreenshotInput,
  MatchupLeadrecBody,
  type MatchupLeadrecInput,
} from '../dto';
import { QuotaService } from '../quota/quota.service';
import { AdvisorService } from './advisor.service';
import { BattleVisionService } from './battle-vision.service';

// 추천 시스템: 로그인 + 일일 쿼터 소비 후 Anthropic 호출.
@Controller()
@UseGuards(JwtAuthGuard)
export class AdvisorController {
  constructor(
    private readonly advisor: AdvisorService,
    private readonly quota: QuotaService,
    private readonly battleVision: BattleVisionService,
  ) {}

  @Post('analyze-party')
  @HttpCode(200)
  async analyzeParty(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(AnalyzePartyBody)) body: AnalyzePartyInput,
  ) {
    await this.quota.consumeOrThrow(userId);
    return this.advisor.adviseParty(body.party);
  }

  @Post('matchup-leadrec')
  @HttpCode(200)
  async matchupLeadrec(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(MatchupLeadrecBody)) body: MatchupLeadrecInput,
  ) {
    await this.quota.consumeOrThrow(userId);
    return this.advisor.adviseMatchup(body.state, body.megaForms);
  }

  @Post('battle-advice')
  @HttpCode(200)
  async battleAdvice(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(BattleAdviceBody)) body: BattleAdviceInput,
  ) {
    await this.quota.consumeOrThrow(userId);
    return this.advisor.adviseBattle(body.state);
  }

  @Post('battle-screenshot')
  @HttpCode(200)
  async battleScreenshot(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(BattleScreenshotBody)) body: BattleScreenshotInput,
  ) {
    await this.quota.consumeOrThrow(userId);
    return this.battleVision.adviseFromScreenshot(body.image, body.note);
  }
}
