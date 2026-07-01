export type ProviderName = 'internal' | 'kakao' | 'naver';

export interface VerifiedIdentity {
  provider: ProviderName;
  providerUserId: string;
  email?: string;
  nickname?: string;
}
