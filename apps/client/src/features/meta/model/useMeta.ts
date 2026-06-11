import { useQuery } from '@tanstack/react-query';

import { fetchMeta, type MetaSummary } from '../api';

export const useMeta = (): ReturnType<typeof useQuery<MetaSummary>> =>
  useQuery({
    queryKey: ['meta'],
    queryFn: fetchMeta,
  });
