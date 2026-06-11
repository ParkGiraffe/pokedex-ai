import { useQuery } from '@tanstack/react-query';

import { fetchSharedPreset } from '../api';

// 공유 토큰으로 공개 조회(비로그인 포함). 없는 토큰은 404 — 재시도하지 않는다.
export const useSharedPreset = (token: string) =>
  useQuery({
    queryKey: ['shared-preset', token],
    queryFn: () => fetchSharedPreset(token),
    enabled: Boolean(token),
    retry: false,
  });
