import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type AuthenticatedRequest } from './auth.guard';

// JwtAuthGuard가 채운 userId를 핸들러 파라미터로 꺼낸다.
export const CurrentUserId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  return context.switchToHttp().getRequest<AuthenticatedRequest>().userId;
});
