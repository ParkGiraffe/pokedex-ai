import { type CanActivate, type ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type Request } from 'express';

import { TOKEN_SERVICE, type TokenService } from './domain/token-service.port';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

// Authorization: Bearer <jwt> 검증 후 req.userId를 채운다. 토큰 검증은 TokenService 포트에 위임.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증이 필요합니다');
    }
    try {
      const payload = await this.tokens.verify(header.slice('Bearer '.length));
      request.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }
  }
}
