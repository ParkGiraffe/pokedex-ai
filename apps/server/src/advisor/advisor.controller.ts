import { Body, Controller, HttpCode, Post } from "@nestjs/common";

import {
  AnalyzePartyBody,
  type AnalyzePartyInput,
  BattleAdviceBody,
  type BattleAdviceInput,
  MatchupLeadrecBody,
  type MatchupLeadrecInput,
} from "../dto";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AdvisorService } from "./advisor.service";

// 추천 시스템: 서버가 Anthropic API를 호출해 ClaudeResponse 스키마로 응답.
@Controller()
export class AdvisorController {
  constructor(private readonly advisor: AdvisorService) {}

  @Post("analyze-party")
  @HttpCode(200)
  analyzeParty(@Body(new ZodValidationPipe(AnalyzePartyBody)) body: AnalyzePartyInput) {
    return this.advisor.adviseParty(body.party);
  }

  @Post("matchup-leadrec")
  @HttpCode(200)
  matchupLeadrec(@Body(new ZodValidationPipe(MatchupLeadrecBody)) body: MatchupLeadrecInput) {
    return this.advisor.adviseMatchup(body.state, body.megaForms);
  }

  @Post("battle-advice")
  @HttpCode(200)
  battleAdvice(@Body(new ZodValidationPipe(BattleAdviceBody)) body: BattleAdviceInput) {
    return this.advisor.adviseBattle(body.state);
  }
}
