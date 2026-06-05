import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CreatePresetBody, type CreatePresetInput, UpdatePresetBody, type UpdatePresetInput } from './dto';
import { type Preset } from './preset.entity';
import { PresetsService } from './presets.service';

const toRes = (preset: Preset) => ({
  id: preset.id,
  name: preset.name,
  party: preset.party,
  shareToken: preset.shareToken ?? null,
  createdAt: preset.createdAt,
  updatedAt: preset.updatedAt,
});

@Controller('presets')
@UseGuards(JwtAuthGuard)
export class PresetsController {
  constructor(private readonly presets: PresetsService) {}

  @Get()
  async list(@CurrentUserId() userId: string) {
    return (await this.presets.list(userId)).map(toRes);
  }

  @Post()
  @HttpCode(201)
  async create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(CreatePresetBody)) body: CreatePresetInput,
  ) {
    return toRes(await this.presets.create(userId, body.name, body.party));
  }

  @Get(':id')
  async get(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return toRes(await this.presets.getOwned(userId, id));
  }

  @Put(':id')
  async update(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdatePresetBody)) body: UpdatePresetInput,
  ) {
    return toRes(await this.presets.update(userId, id, { name: body.name, party: body.party }));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.presets.remove(userId, id);
  }

  @Post(':id/share')
  @HttpCode(200)
  async share(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return { shareToken: await this.presets.share(userId, id) };
  }

  @Delete(':id/share')
  @HttpCode(204)
  async unshare(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.presets.unshare(userId, id);
  }
}
