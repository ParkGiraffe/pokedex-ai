import { UserTier } from '../users/enums';

export const PRESET_CAP_BY_TIER: Record<UserTier, number> = {
  [UserTier.FREE]: 2,
  [UserTier.PAID]: 20,
};
