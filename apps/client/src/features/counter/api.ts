import { apiRequest } from '@/features/auth';

export type CounterMon = { pick: string; move: string; koChance: number; survives: boolean };
export type CounterEntry = {
  setName: string;
  item?: string;
  teraType?: string;
  moves: string[];
  counters: CounterMon[];
};
export type CounterRes = { opponent: string; entries: CounterEntry[] };
export type CounterPoolMon = { species: string; moves?: string[] };

export const fetchCounters = (body: { opponentSpecies: string; myPool: CounterPoolMon[] }): Promise<CounterRes> =>
  apiRequest('/counter', { method: 'POST', body: JSON.stringify(body) }, '카운터 계산 실패');
