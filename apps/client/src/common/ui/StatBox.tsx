import { cn } from '@/common/lib/cn';

type StatBoxProps = {
  label: string;
  value: number | string;
  className?: string;
};

// 읽기 전용 스탯 표시 박스. 큰 숫자 + 작은 라벨.
export const StatBox = ({ label, value, className }: StatBoxProps) => (
  <div className={cn('bg-secondary flex flex-col items-center rounded-lg px-2 py-2', className)}>
    <span className="text-foreground text-base font-bold">{value}</span>
    <span className="text-muted-foreground text-[10px]">{label}</span>
  </div>
);
