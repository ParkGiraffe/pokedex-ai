// 구독 등급. subscriptions 테이블이 진실의 원천이지만(Phase E), users.tier는 파생 캐시로 둔다.
export enum UserTier {
  FREE = "free",
  PAID = "paid",
}
