import { type ProviderName, type VerifiedIdentity } from './identity';

export interface AuthProvider {
  readonly name: ProviderName;
  authenticate(credentials: unknown): Promise<VerifiedIdentity>;
}

export const AUTH_PROVIDERS = Symbol('AUTH_PROVIDERS');
