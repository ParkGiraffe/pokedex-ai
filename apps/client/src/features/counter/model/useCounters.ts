import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { type CounterPoolMon, type CounterRes, fetchCounters } from '../api';

export const useCounters = (): ReturnType<
  typeof useMutation<CounterRes, Error, { opponentSpecies: string; myPool: CounterPoolMon[] }>
> =>
  useMutation({
    mutationFn: fetchCounters,
    onError: (error) => toast.error(error instanceof Error ? error.message : '카운터 계산 실패'),
  });
