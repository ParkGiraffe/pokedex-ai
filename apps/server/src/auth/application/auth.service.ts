import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { type User } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';
import { AUTH_PROVIDERS, type AuthProvider } from '../domain/auth-provider.port';
import { type ProviderName, type VerifiedIdentity } from '../domain/identity';
import { PASSWORD_HASHER, type PasswordHasher } from '../domain/password-hasher.port';
import { TOKEN_SERVICE, type TokenService } from '../domain/token-service.port';

export interface AuthResult {
  accessToken: string;
  user: { id: string; email?: string; nickname?: string; tier: string };
}

// 인증 유스케이스 오케스트레이션. 주입된 포트(provider 전략·해셔·토큰)에만 의존하고
// 구체 라이브러리·DB는 모른다.
@Injectable()
export class AuthService {
  private readonly providers: Map<ProviderName, AuthProvider>;

  constructor(
    private readonly users: UsersService,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(AUTH_PROVIDERS) providers: AuthProvider[],
  ) {
    this.providers = new Map(providers.map((provider) => [provider.name, provider]));
  }

  // 내부 회원가입: 이메일+비밀번호. OAuth 제공자는 가입 단계 없이 첫 로그인 시 자동 프로비저닝된다.
  async register(email: string, password: string, nickname?: string): Promise<AuthResult> {
    if (await this.users.findByEmail(email)) {
      throw new ConflictException('이미 가입된 이메일입니다');
    }
    const passwordHash = await this.hasher.hash(password);
    const user = await this.users.create({
      provider: 'internal',
      providerUserId: email,
      email,
      passwordHash,
      nickname,
    });
    return this.issue(user);
  }

  // 로그인: provider 전략으로 신원 검증 → 사용자 조회/프로비저닝 → 토큰 발급.
  async login(provider: ProviderName, credentials: unknown): Promise<AuthResult> {
    const adapter = this.providers.get(provider);
    if (!adapter) {
      throw new UnauthorizedException('지원하지 않는 로그인 방식입니다');
    }
    const identity = await adapter.authenticate(credentials);
    return this.issue(await this.resolveUser(identity));
  }

  // internal은 authenticate가 이미 기존 사용자를 검증했으므로 항상 존재한다.
  // OAuth는 첫 로그인 시 사용자가 없을 수 있어 자동 생성한다.
  private async resolveUser(identity: VerifiedIdentity): Promise<User> {
    const existing = await this.users.findByProvider(identity.provider, identity.providerUserId);
    if (existing) {
      return existing;
    }
    return this.users.create({
      provider: identity.provider,
      providerUserId: identity.providerUserId,
      email: identity.email,
      nickname: identity.nickname,
    });
  }

  private async issue(user: User): Promise<AuthResult> {
    const accessToken = await this.tokens.sign({ sub: user.id });
    return {
      accessToken,
      user: { id: user.id, email: user.email, nickname: user.nickname, tier: user.tier },
    };
  }
}
