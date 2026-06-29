import { cn } from '@/common/lib/cn';

type StatBoxProps = {
  label: string;
  value: number | string;
  className?: string;
};

export const StatBox = ({ label, value, className }: StatBoxProps) => (
  <div className={cn('flex flex-col items-center', 'rounded-lg px-2 py-2', 'bg-secondary', className)}>
    <span className="text-foreground text-base font-bold">{value}</span>
    <span className="text-muted-foreground text-[10px]">{label}</span>
  </div>
);
