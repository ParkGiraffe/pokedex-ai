import { Badge } from '@/common/ui/Badge';
import { Card } from '@/common/ui/Card';

export const MatrixLegend = () => (
  <Card className="flex flex-wrap items-center gap-4">
    <span className="text-muted-foreground text-xs font-semibold">범례</span>
    <span className="flex items-center gap-1.5 text-xs">
      <Badge variant="success" size="sm">
        유리
      </Badge>
      <span className="text-muted-foreground">상성 유리</span>
    </span>
    <span className="flex items-center gap-1.5 text-xs">
      <Badge variant="destructive" size="sm">
        불리
      </Badge>
      <span className="text-muted-foreground">상성 불리</span>
    </span>
    <span className="flex items-center gap-1.5 text-xs">
      <Badge variant="muted" size="sm">
        호각
      </Badge>
      <span className="text-muted-foreground">호각</span>
    </span>
    <span className="text-muted-foreground text-xs">
      <span className="text-success font-medium">↑</span> 선공 /<span className="text-destructive font-medium"> ↓</span>{' '}
      후공 /<span className="font-medium"> =</span> 동속
    </span>
    <span className="text-muted-foreground text-xs">KO% = 내 최적기 기준</span>
  </Card>
);
