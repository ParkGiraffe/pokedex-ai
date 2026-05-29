import { cn } from "@/common/lib/cn";

type StatBoxProps = {
  label: string;
  value: number | string;
  className?: string;
};

// 읽기 전용 스탯 표시 박스. 큰 숫자 + 작은 라벨.
export const StatBox = ({ label, value, className }: StatBoxProps) => (
  <div className={cn("flex flex-col items-center rounded-lg bg-secondary px-2 py-2", className)}>
    <span className="text-base font-bold text-foreground">{value}</span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
);
