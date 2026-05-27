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
        <p className="text-sm text-neutral-400">상대 종족을 입력하면 추천이 표시된다.</p>
      </Card>
    );
  }
  const { moveOptions, switchOptions, recommendation } = advice;

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-300">추천</h2>
      <p className="rounded bg-emerald-950 px-2 py-1.5 text-sm font-medium text-emerald-300">
        {recommendation}
      </p>

      {moveOptions.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-neutral-500">내 기술</p>
          <ul className="flex flex-col gap-0.5 text-sm">
            {moveOptions.map((option) => (
              <li key={option.move} className="flex items-center justify-between gap-2">
                <span className="text-neutral-200">{option.move}</span>
                <span className={cn("text-xs", option.koChance >= 0.5 ? "text-rose-400" : "text-neutral-400")}>
                  {option.damaging ? `${option.hitsText} · KO ${Math.round(option.koChance * 100)}%` : "변화기"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {switchOptions.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-neutral-500">교체</p>
          <ul className="flex flex-col gap-0.5 text-sm">
            {switchOptions.map((option) => (
              <li key={option.pick} className="flex items-center justify-between gap-2">
                <span className="text-neutral-200">{option.pick}</span>
                <span className="text-xs text-neutral-400">{option.verdict}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};
