import { useQuery } from '@tanstack/react-query';

import { fetchSharedPreset, type SharedPresetRes } from '../api';

export const useSharedPreset = (token: string): ReturnType<typeof useQuery<SharedPresetRes>> =>
  useQuery({
    queryKey: ['shared-preset', token],
    queryFn: () => fetchSharedPreset(token),
    enabled: Boolean(token),
    retry: false,
  });
