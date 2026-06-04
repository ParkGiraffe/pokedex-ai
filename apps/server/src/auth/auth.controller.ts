import { Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";

import { UsersService } from "../users/users.service";
import { type AuthResult, AuthService } from "./application/auth.service";
import { JwtAuthGuard } from "./auth.guard";
import { CurrentUserId } from "./current-user.decorator";
import { LoginDto, RegisterDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService
  ) {}

  @Post("register")
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.auth.register(dto.email, dto.password, dto.nickname);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.auth.login("internal", { email: dto.email, password: dto.password });
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUserId() userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      return null;
    }
    return { id: user.id, email: user.email, nickname: user.nickname, tier: user.tier };
  }
}
