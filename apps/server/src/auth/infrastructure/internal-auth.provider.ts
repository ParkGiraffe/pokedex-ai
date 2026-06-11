import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../../users/users.service';
import { type AuthProvider } from '../domain/auth-provider.port';
import { type ProviderName, type VerifiedIdentity } from '../domain/identity';
import { PASSWORD_HASHER, type PasswordHasher } from '../domain/password-hasher.port';

// 내부 로그인 제공자: 저장된 이메일+비밀번호 해시로 검증. providerUserId는 이메일을 쓴다.
@Injectable()
export class InternalAuthProvider implements AuthProvider {
  readonly name: ProviderName = 'internal';

  constructor(
    private readonly users: UsersService,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async authenticate(credentials: unknown): Promise<VerifiedIdentity> {
    const { email, password } = (credentials ?? {}) as { email?: string; password?: string };
    if (!email || !password) {
      throw new UnauthorizedException('이메일과 비밀번호가 필요합니다');
    }
    const user = await this.users.findByProvider('internal', email);
    if (!user?.passwordHash || !(await this.hasher.verify(password, user.passwordHash))) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }
    return { provider: 'internal', providerUserId: email, email };
  }
}
