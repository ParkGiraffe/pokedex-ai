import { type Party } from "@pokedex-agent/pokedex-core";
import { useState } from "react";

import { cn } from "@/common/lib/cn";
import { Button } from "@/common/ui/Button";
import { Card } from "@/common/ui/Card";

import { toAdviceMon } from "../lib/to-advice-mon";
import { useDecide } from "../model/useDecide";

type AdvisorPanelProps = {
  active?: Party[number];
  opponentSpecies: string;
  bench: Party;
};

export const AdvisorPanel = ({ active, opponentSpecies, bench }: AdvisorPanelProps) => {
  const [mega, setMega] = useState(false);
  const decide = useDecide();
  const result = decide.data;
  const ready = Boolean(active) && opponentSpecies.trim().length > 0;

  const handleAskAdvisor = () => {
    if (!active || !ready) {
      return;
    }
    decide.mutate({
      active: toAdviceMon(active, { mega }),
      opponentSpecies,
      bench: bench.map((member) => toAdviceMon(member)),
    });
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-300">AI 어드바이저 (챔피언스 엔진)</h2>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          <input type="checkbox" checked={mega} onChange={(event) => setMega(event.currentTarget.checked)} />
          내 액티브 메가진화
        </label>
      </div>

      <Button onClick={handleAskAdvisor} disabled={!ready || decide.isPending}>
        {decide.isPending ? "분석 중..." : "지금 뭐 할까? (서버)"}
      </Button>

      {decide.isError && (
        <p className="text-sm text-rose-400">
          어드바이저 서버에 연결하지 못했다. 서버(apps/server)가 떠 있는지 확인하라.
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-3 text-sm">
          <p className="rounded bg-emerald-950 px-2 py-1.5 font-medium text-emerald-300">{result.summary}</p>

          <div>
            <p className="mb-1 text-xs text-neutral-500">기술 (OHKO 확률)</p>
            <ul className="flex flex-col gap-0.5">
              {result.moveOptions.slice(0, 4).map((option) => (
                <li key={option.move} className="flex items-center justify-between gap-2">
                  <span className="text-neutral-200">{option.move}</span>
                  <span className={cn(option.koChance >= 0.5 ? "text-rose-400" : "text-neutral-400")}>
                    {Math.round(option.koChance * 100)}% · {option.koText}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {result.switchOptions.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-neutral-500">교체 후보</p>
              <ul className="flex flex-col gap-0.5">
                {result.switchOptions.map((option) => (
                  <li key={option.pick} className="flex items-center justify-between gap-2">
                    <span className="text-neutral-200">{option.pick}</span>
                    <span className="text-neutral-400">{option.matchup.verdict}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
