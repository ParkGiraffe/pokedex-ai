import { useQuery } from '@tanstack/react-query';

import { fetchMeta } from '../api';

export const useMeta = () =>
  useQuery({
    queryKey: ['meta'],
    queryFn: fetchMeta,
  });
