import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { type CounterPoolMon, type CounterRes, fetchCounters } from '../api';

// 약점 상대마다 버튼으로 카운터를 조회한다(요청 단위라 mutation).
export const useCounters = (): ReturnType<
  typeof useMutation<CounterRes, Error, { opponentSpecies: string; myPool: CounterPoolMon[] }>
> =>
  useMutation({
    mutationFn: fetchCounters,
    onError: (error) => toast.error(error instanceof Error ? error.message : '카운터 계산 실패'),
  });
