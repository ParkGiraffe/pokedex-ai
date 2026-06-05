import { UserTier } from '../users/user.enums';

// 티어별 프리셋 저장 한도. 다운그레이드 시 기존 프리셋은 삭제하지 않고 신규 저장만 막는다.
export const PRESET_CAP_BY_TIER: Record<UserTier, number> = {
  [UserTier.FREE]: 2,
  [UserTier.PAID]: 20,
};
