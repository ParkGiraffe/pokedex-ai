import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth';

import { fetchPresets, type PresetRes } from '../api';

export const usePresets = (): ReturnType<typeof useQuery<PresetRes[]>> => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['presets'],
    queryFn: fetchPresets,
    enabled: Boolean(token),
  });
};
