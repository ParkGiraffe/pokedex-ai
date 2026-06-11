import { useAuthStore } from '@/features/auth';

import { useQuota } from '../model/useQuota';

// 헤더에 오늘 남은 AI 질의 수를 표시한다. 0이면 경고색.
export const QuotaBadge = () => {
  const token = useAuthStore((state) => state.token);
  const quota = useQuota();

  if (!token || !quota.data) {
    return null;
  }

  const { remaining, cap } = quota.data;
  const depleted = remaining <= 0;

  return (
    <span
      title="오늘 남은 AI 질의"
      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
        depleted ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'
      }`}
    >
      AI {remaining}/{cap}
    </span>
  );
};
