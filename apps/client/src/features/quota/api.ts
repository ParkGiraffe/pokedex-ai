import { apiRequest } from '@/features/auth';

export type QuotaStatus = { used: number; remaining: number; cap: number };

export const fetchQuota = (): Promise<QuotaStatus> => apiRequest('/quota', { method: 'GET' }, '쿼터 조회 실패');
