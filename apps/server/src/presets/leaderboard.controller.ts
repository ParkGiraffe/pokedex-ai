import { Controller, Get, Query } from '@nestjs/common';
import { type PartyDraft } from '@pokedex-agent/pokedex-core';

import { PresetsService } from './presets.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly presets: PresetsService) {}

  @Get()
  async list(
    @Query('limit') limitParam?: string,
  ): Promise<{ shareToken: string | undefined; name: string; copyCount: number; party: PartyDraft }[]> {
    const limit = Math.min(parseInt(limitParam ?? '20', 10) || 20, 100);
    const presets = await this.presets.leaderboard(limit);
    return presets.map((preset) => ({
      shareToken: preset.shareToken,
      name: preset.name,
      copyCount: preset.copyCount,
      party: preset.party,
    }));
  }
}
