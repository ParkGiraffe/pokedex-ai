import { type ClaudeResponse } from '@pokedex-agent/pokedex-core';
import { AlertTriangle, Info, Lightbulb, Sparkles } from 'lucide-react';
import { type ComponentType } from 'react';

import { cn } from '@/common/lib/cn';
import { Badge } from '@/common/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/common/ui/Card';
import { PokemonIcon } from '@/features/pokemon-picker';

type Kind = 'strength' | 'weakness' | 'warning' | 'recommendation';

type KindMeta = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  iconColor: string;
};

const KIND_META: Record<Kind, KindMeta> = {
  strength: { label: '장점', Icon: Sparkles, iconColor: 'text-success' },
  weakness: { label: '단점', Icon: AlertTriangle, iconColor: 'text-destructive' },
  warning: { label: '주의', Icon: Info, iconColor: 'text-warning' },
  recommendation: { label: '추천', Icon: Lightbulb, iconColor: 'text-foreground' },
};

const KIND_ORDER: ReadonlyArray<Kind> = ['strength', 'weakness', 'warning', 'recommendation'];

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
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex-row items-center gap-2 p-0">
          <Sparkles className="text-primary size-4 shrink-0" />
          <p className="text-foreground text-sm font-medium">{result.summary}</p>
        </CardContent>
      </Card>

      {ranks.map(({ pick, rank }) => {
        const items = result.details.filter((detail) => detail.target === pick);
        if (items.length === 0) {
          return null;
        }
        const isTop = rank === 1;
        return (
          <Card key={pick} className={cn('flex flex-col gap-3', isTop && 'border-primary/40')}>
            <CardHeader className="flex-row items-center justify-between gap-2 p-0 pb-0">
              <div className="flex items-center gap-2">
                <Badge variant={isTop ? 'success' : 'muted'}>{rank}순위</Badge>
                <PokemonIcon species={pick} className="h-7 w-7" />
                <CardTitle className="text-base">{pick}</CardTitle>
              </div>
            </CardHeader>

            {KIND_ORDER.map((kind) => {
              const list = items.filter((item) => item.kind === kind);
              if (list.length === 0) {
                return null;
              }
              const { label, Icon, iconColor } = KIND_META[kind];
              return (
                <section key={kind} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn('size-3.5', iconColor)} />
                    <span className="text-muted-foreground text-xs font-semibold">{label}</span>
                  </div>
                  <ul className="text-foreground ml-5 flex list-disc flex-col gap-1 text-sm">
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
