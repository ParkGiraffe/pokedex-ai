import { type ClaudeResponse } from "@pokedex-agent/pokedex-core";

import { Card } from "@/common/ui/Card";
import { PokemonIcon } from "@/features/pokemon-picker/ui/PokemonIcon";

const KIND_LABEL = {
  strength: "장점",
  weakness: "단점",
  warning: "주의",
  recommendation: "추천",
} as const;

const KIND_ACCENT = {
  strength: "text-emerald-400",
  weakness: "text-rose-400",
  warning: "text-amber-400",
  recommendation: "text-sky-400",
} as const;

const KIND_ORDER = ["strength", "weakness", "warning", "recommendation"] as const;

export type LeadRank = {
  pick: string;
  rank: number;
};

type LeadrecResultProps = {
  result: ClaudeResponse;
  ranks: ReadonlyArray<LeadRank>;
};

export const LeadrecResult = ({ result, ranks }: LeadrecResultProps) => {
  if (ranks.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <p className="text-sm font-semibold text-emerald-400">{result.summary}</p>
      </Card>
      {ranks.map(({ pick, rank }) => {
        const items = result.details.filter((detail) => detail.target === pick);
        if (items.length === 0) {
          return null;
        }
        return (
          <Card key={pick} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-100">
              <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-300">{rank}순위</span>
              <PokemonIcon species={pick} className="h-7 w-7" />
              {pick}
            </h3>
            {KIND_ORDER.map((kind) => {
              const list = items.filter((item) => item.kind === kind);
              if (list.length === 0) {
                return null;
              }
              return (
                <section key={kind} className="flex flex-col gap-0.5">
                  <h4 className={`text-xs font-semibold ${KIND_ACCENT[kind]}`}>{KIND_LABEL[kind]}</h4>
                  <ul className="ml-3 flex list-disc flex-col gap-0.5 text-sm text-neutral-200">
                    {list.map((item, index) => (
                      <li key={`${kind}-${index}`}>{item.text}</li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </Card>
        );
      })}
    </div>
  );
};
