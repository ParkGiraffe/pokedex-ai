import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { type User } from '../users/entities';
import { UsersService } from '../users/users.service';
import { AUTH_PROVIDERS, type AuthProvider } from './providers/auth-provider.port';
import { type ProviderName, type VerifiedIdentity } from './providers/identity';
import { PASSWORD_HASHER, type PasswordHasher } from './providers/password-hasher.port';
import { TOKEN_SERVICE, type TokenService } from './providers/token-service.port';

export interface AuthResult {
  accessToken: string;
  user: { id: string; email?: string; nickname?: string; tier: string };
}

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

  async login(provider: ProviderName, credentials: unknown): Promise<AuthResult> {
    const adapter = this.providers.get(provider);
    if (!adapter) {
      throw new UnauthorizedException('지원하지 않는 로그인 방식입니다');
    }
    const identity = await adapter.authenticate(credentials);
    return this.issue(await this.resolveUser(identity));
  }

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
