import { cn } from "@/common/lib/cn";
import { Card } from "@/common/ui/Card";

import { type BattleAdvice } from "../lib/battle";

type AdvisorPanelProps = {
  advice: BattleAdvice | undefined;
};

// 결정론 인배틀 추천. 페이지 상태(메가·랭크·상태이상)가 그대로 반영된다.
export const AdvisorPanel = ({ advice }: AdvisorPanelProps) => {
  if (!advice) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">상대 포켓몬을 입력하면 추천이 표시된다.</p>
      </Card>
    );
  }
  const { moveOptions, switchOptions, firstMove, recommendation } = advice;
  const firstMoveClass =
    firstMove === "선공" ? "text-success" : firstMove === "후공" ? "text-destructive" : "text-muted-foreground";

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">추천</h2>
        <span className={cn("rounded-md bg-muted px-2 py-0.5 text-xs font-medium", firstMoveClass)}>
          {firstMove}
        </span>
      </div>
      <p className="rounded bg-primary/10 px-2 py-1.5 text-sm font-medium text-primary">
        {recommendation}
      </p>

      {moveOptions.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-muted-foreground">내 기술</p>
          <ul className="flex flex-col gap-0.5 text-sm">
            {moveOptions.map((option) => (
              <li key={option.move} className="flex items-center justify-between gap-2">
                <span className="text-foreground">{option.move}</span>
                <span className={cn("text-xs", option.koChance >= 0.5 ? "text-destructive" : "text-muted-foreground")}>
                  {option.damaging ? `${option.hitsText} · KO ${Math.round(option.koChance * 100)}%` : "변화기"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {switchOptions.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-muted-foreground">교체</p>
          <ul className="flex flex-col gap-0.5 text-sm">
            {switchOptions.map((option) => (
              <li key={option.pick} className="flex items-center justify-between gap-2">
                <span className="text-foreground">{option.pick}</span>
                <span className="text-xs text-muted-foreground">{option.verdict}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};
