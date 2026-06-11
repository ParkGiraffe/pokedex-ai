import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ImportPartyBody, type ImportPartyInput } from '../dto';
import { QuotaService } from '../quota/quota.service';
import { type ImportResult, ImportService } from './import.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(
    private readonly importService: ImportService,
    private readonly quota: QuotaService,
  ) {}

  @Post('import-party')
  @HttpCode(200)
  async importParty(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(ImportPartyBody)) body: ImportPartyInput,
  ): Promise<ImportResult> {
    await this.quota.consumeOrThrow(userId);
    const sources = body.images ?? (body.image ? [body.image] : []);
    return this.importService.importParty(sources);
  }
}
