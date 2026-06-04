import { UserTier } from "../users/user.enums";

// 티어별 일일 AI 질의 한도.
export const QUOTA_CAP_BY_TIER: Record<UserTier, number> = {
  [UserTier.FREE]: 2,
  [UserTier.PAID]: 100,
};
