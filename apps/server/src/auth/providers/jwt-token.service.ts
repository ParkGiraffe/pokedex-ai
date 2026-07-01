import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { type AuthTokenPayload, type TokenService } from './token-service.port';

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
