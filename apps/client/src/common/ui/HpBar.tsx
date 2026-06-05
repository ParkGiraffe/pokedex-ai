import { cn } from '@/common/lib/cn';

type HpBarProps = {
  percent: number;
  className?: string;
};

// 잔량별 색: >50% 초록, >20% 노랑, 이하 빨강. 포켓몬 게임 HP 게이지 시그니처.
const hpColor = (percent: number): string => (percent > 50 ? '#3fbf5f' : percent > 20 ? '#f5b912' : '#e0473a');

export const HpBar = ({ percent, className }: HpBarProps) => {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={cn('w-full', className)}>
      <div className="text-muted-foreground mb-1 flex justify-between text-[10px]">
        <span>HP</span>
        <span>{Math.round(clamped)}%</span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${clamped}%`, backgroundColor: hpColor(clamped) }}
        />
      </div>
    </div>
  );
};
