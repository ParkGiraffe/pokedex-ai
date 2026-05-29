import { type ClaudeResponse } from "@pokedex-agent/pokedex-core";

import { Card } from "@/common/ui/Card";

const KIND_LABEL: Record<string, string> = {
  strength: "장점",
  weakness: "단점",
  warning: "주의",
  recommendation: "추천",
};

const KIND_ACCENT: Record<string, string> = {
  strength: "text-primary",
  weakness: "text-destructive",
  warning: "text-warning",
  recommendation: "text-info",
};

const KIND_ORDER: Array<keyof typeof KIND_LABEL> = ["strength", "weakness", "warning", "recommendation"];

type AnalysisResultProps = {
  result: ClaudeResponse;
};

export const AnalysisResult = ({ result }: AnalysisResultProps) => {
  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    items: result.details.filter((detail) => detail.kind === kind),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-primary">{result.summary}</p>
        {grouped.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-2.5">
            {grouped.map((group) => (
              <section key={group.kind} className="flex flex-col gap-1">
                <h3 className={`text-xs font-semibold ${KIND_ACCENT[group.kind] ?? "text-foreground"}`}>
                  {KIND_LABEL[group.kind] ?? group.kind}
                </h3>
                <ul className="flex flex-col gap-0.5 text-sm text-foreground">
                  {group.items.map((item, index) => (
                    <li key={`${group.kind}-${index}`}>
                      {item.target && <span className="text-muted-foreground">{item.target}: </span>}
                      {item.text}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Card>

      {result.actionable.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-foreground">제안</h3>
          <ul className="mt-1.5 flex flex-col gap-1 text-sm text-foreground">
            {result.actionable.map((action, index) => (
              <li key={`${action.kind}-${index}`}>
                {action.reason}
                {action.from && action.to ? ` (${action.from} → ${action.to})` : ""}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
