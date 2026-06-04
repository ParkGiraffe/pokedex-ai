// 액세스 토큰 발급·검증 포트. JWT 라이브러리(@nestjs/jwt 등)에 application이 묶이지 않도록 추상화한다.
export interface AuthTokenPayload {
  sub: string;
}

export interface TokenService {
  sign(payload: AuthTokenPayload): Promise<string>;
  verify(token: string): Promise<AuthTokenPayload>;
}

export const TOKEN_SERVICE = Symbol("TOKEN_SERVICE");
