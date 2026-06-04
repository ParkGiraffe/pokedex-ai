// 인증 도메인의 순수 타입. NestJS·MikroORM·특정 라이브러리에 의존하지 않는다.

// 신원 제공자. 지금은 internal(이메일+비밀번호)만 구현하고, kakao·naver는 추후 같은 포트로 추가한다.
export type ProviderName = "internal" | "kakao" | "naver";

// 제공자가 인증을 마친 뒤 돌려주는 검증된 신원.
export interface VerifiedIdentity {
  provider: ProviderName;
  providerUserId: string;
  email?: string;
  nickname?: string;
}
