import { Controller, Get, Param } from '@nestjs/common';
import { type PartyDraft } from '@pokedex-agent/pokedex-core';

import { PresetsService } from './presets.service';

// 공유 토큰으로 프리셋을 읽기전용 공개 조회한다. JwtAuthGuard 없음 — 비로그인도 열람 가능.
// name·party만 노출하고 소유자 id·토큰·타임스탬프는 내보내지 않는다.
@Controller('shared-presets')
export class SharedPresetsController {
  constructor(private readonly presets: PresetsService) {}

  @Get(':token')
  async get(@Param('token') token: string): Promise<{ name: string; party: PartyDraft }> {
    const preset = await this.presets.getByShareToken(token);
    return { name: preset.name, party: preset.party };
  }
}
