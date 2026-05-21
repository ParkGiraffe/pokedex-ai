import { type ClaudeResponse } from "@pokedex-agent/pokedex-core";

import { cn } from "@/common/lib/cn";
import { Card } from "@/common/ui/Card";

const KIND_LABEL: Record<string, string> = {
  strength: "장점",
  weakness: "약점",
  warning: "주의",
  recommendation: "추천",
};

const KIND_BADGE: Record<string, string> = {
  strength: "bg-emerald-900 text-emerald-300",
  weakness: "bg-rose-900 text-rose-300",
  warning: "bg-amber-900 text-amber-300",
  recommendation: "bg-sky-900 text-sky-300",
};

type AppliedResultProps = {
  result: ClaudeResponse;
};

export const AppliedResult = ({ result }: AppliedResultProps) => (
  <div className="flex flex-col gap-3">
    <Card>
      <p className="text-sm font-semibold text-emerald-400">{result.summary}</p>
    </Card>

    {result.details.map((detail, index) => (
      <Card key={`${detail.kind}-${index}`}>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded px-2 py-0.5 text-xs font-medium",
              KIND_BADGE[detail.kind] ?? "bg-neutral-800 text-neutral-300"
            )}
          >
            {KIND_LABEL[detail.kind] ?? detail.kind}
          </span>
          <span className="text-xs text-neutral-400">{detail.target}</span>
        </div>
        <p className="mt-1.5 text-sm text-neutral-200">{detail.text}</p>
      </Card>
    ))}

    {result.actionable.length > 0 && (
      <Card>
        <h3 className="text-sm font-semibold text-neutral-200">제안</h3>
        <ul className="mt-1.5 flex flex-col gap-1 text-sm text-neutral-300">
          {result.actionable.map((action, index) => (
            <li key={`${action.kind}-${index}`}>
              {action.slot ? `슬롯 ${action.slot}: ` : ""}
              {action.reason}
              {action.from && action.to ? ` (${action.from} → ${action.to})` : ""}
            </li>
          ))}
        </ul>
      </Card>
    )}
  </div>
);
