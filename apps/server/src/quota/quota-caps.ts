import { UserTier } from '../users/enums';

export const QUOTA_CAP_BY_TIER: Record<UserTier, number> = {
  [UserTier.FREE]: 2,
  [UserTier.PAID]: 100,
};
