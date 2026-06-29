export interface AuthTokenPayload {
  sub: string;
}

export interface TokenService {
  sign(payload: AuthTokenPayload): Promise<string>;
  verify(token: string): Promise<AuthTokenPayload>;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
