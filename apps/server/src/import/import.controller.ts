import { Body, Controller, HttpCode, Post } from "@nestjs/common";

import { ImportPartyBody, type ImportPartyInput } from "../dto";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { type ImportResult, ImportService } from "./import.service";

@Controller()
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post("import-party")
  @HttpCode(200)
  importParty(@Body(new ZodValidationPipe(ImportPartyBody)) body: ImportPartyInput): Promise<ImportResult> {
    const sources = body.images ?? (body.image ? [body.image] : []);
    return this.importService.importParty(sources);
  }
}
