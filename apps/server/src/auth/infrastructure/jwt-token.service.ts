import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { type AuthTokenPayload, type TokenService } from '../domain/token-service.port';

// @nestjs/jwt를 TokenService 포트 뒤에 가둔다 — application은 JWT 라이브러리를 모른다.
@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(payload: AuthTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload);
  }

  verify(token: string): Promise<AuthTokenPayload> {
    return this.jwt.verifyAsync<AuthTokenPayload>(token);
  }
}
