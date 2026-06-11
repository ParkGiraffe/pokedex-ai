import { cn } from '@/common/lib/cn';

type ResultRowProps = { label: string; value: string; strong?: boolean };

export const ResultRow = ({ label, value, strong }: ResultRowProps) => (
  <div className="flex items-baseline justify-between gap-3">
    <span className="text-muted-foreground text-sm">{label}</span>
    <span className={cn('text-sm', strong ? 'text-primary text-lg font-bold' : 'text-foreground font-medium')}>
      {value}
    </span>
  </div>
);
