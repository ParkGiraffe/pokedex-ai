import { Controller, Get, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../auth/auth.guard";
import { CurrentUserId } from "../auth/current-user.decorator";
import { type QuotaStatus, QuotaService } from "./quota.service";

@Controller("quota")
@UseGuards(JwtAuthGuard)
export class QuotaController {
  constructor(private readonly quota: QuotaService) {}

  @Get()
  status(@CurrentUserId() userId: string): Promise<QuotaStatus> {
    return this.quota.status(userId);
  }
}
