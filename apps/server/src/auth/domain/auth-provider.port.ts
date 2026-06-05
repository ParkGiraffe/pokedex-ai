import { type ProviderName, type VerifiedIdentity } from './identity';

// 인증 제공자 전략. internal(이메일+비번)·kakao·naver가 같은 포트를 구현한다.
// credentials는 제공자별로 다르므로(internal: {email,password}, oauth: {code}) 어댑터가 좁혀 해석한다.
export interface AuthProvider {
  readonly name: ProviderName;
  authenticate(credentials: unknown): Promise<VerifiedIdentity>;
}

// 등록된 모든 AuthProvider 배열을 주입받는 토큰(레지스트리는 AuthService가 name으로 구성).
export const AUTH_PROVIDERS = Symbol('AUTH_PROVIDERS');
