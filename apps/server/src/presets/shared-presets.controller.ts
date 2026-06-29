import { Controller, Get, Param } from '@nestjs/common';
import { type PartyDraft } from '@pokedex-agent/pokedex-core';

import { PresetsService } from './presets.service';

@Controller('shared-presets')
export class SharedPresetsController {
  constructor(private readonly presets: PresetsService) {}

  @Get(':token')
  async get(@Param('token') token: string): Promise<{ name: string; party: PartyDraft }> {
    const preset = await this.presets.getByShareToken(token);
    return { name: preset.name, party: preset.party };
  }
}
