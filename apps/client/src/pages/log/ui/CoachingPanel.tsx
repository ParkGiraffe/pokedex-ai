import { Button } from '@/common/ui/Button';
import { Card } from '@/common/ui/Card';
import { type BattleStatsRes } from '@/features/battle-log';
import { type CounterPoolMon, type CounterRes } from '@/features/counter';
import { useCounters } from '@/features/counter';

import { analyzeCoaching } from '../lib/coaching';

type AggregatedCounter = { pick: string; appearances: number; minKo: number; survivesAll: boolean; robust: boolean };

const aggregateCounters = (data: CounterRes): AggregatedCounter[] => {
  const totalSets = data.entries.length;
  const map = new Map<string, { appearances: number; minKo: number; survivesAll: boolean }>();
  for (const entry of data.entries) {
    for (const counter of entry.counters) {
      const current = map.get(counter.pick) ?? { appearances: 0, minKo: 1, survivesAll: true };
      current.appearances += 1;
      current.minKo = Math.min(current.minKo, counter.koChance);
      current.survivesAll = current.survivesAll && counter.survives;
      map.set(counter.pick, current);
    }
  }
  return [...map.entries()]
    .map(([pick, value]) => ({ pick, ...value, robust: totalSets > 0 && value.appearances === totalSets }))
    .sort((a, b) => b.appearances - a.appearances || b.minKo - a.minKo)
    .slice(0, 4);
};

const CounterLookup = ({ opponent, pool }: { opponent: string; pool: CounterPoolMon[] }) => {
  const counters = useCounters();
  const aggregated = counters.data ? aggregateCounters(counters.data) : [];

  if (pool.length === 0) {
    return <p className="text-muted-foreground text-xs">프리셋을 저장하면 내 파티에서 카운터를 찾아줍니다.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => counters.mutate({ opponentSpecies: opponent, myPool: pool })}
        disabled={counters.isPending}
      >
        {counters.isPending ? '계산 중...' : '내 파티 카운터 찾기'}
      </Button>
      {counters.data &&
        (aggregated.length === 0 ? (
          <p className="text-muted-foreground text-xs">내 파티에 확실한 카운터가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-0.5 text-xs">
            {aggregated.map((counter) => (
              <li key={counter.pick} className="text-foreground">
                {counter.pick}
                <span className="text-muted-foreground">
                  {' '}
                  · 최소 KO {Math.round(counter.minKo * 100)}%{counter.survivesAll ? ' · 생존' : ''}
                  {counter.robust ? ' · 전 세트 대응' : ''}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
};

type CoachingPanelProps = {
  stats: BattleStatsRes;
  pool: CounterPoolMon[];
};

export const CoachingPanel = ({ stats, pool }: CoachingPanelProps) => {
  const coaching = analyzeCoaching(stats);

  if (!coaching.hasEnoughData) {
    return (
      <Card>
        <h2 className="text-foreground text-sm font-semibold">코칭</h2>
        <p className="text-muted-foreground mt-2 text-sm">전적이 3판 이상 쌓이면 약점과 대비책을 분석해 드립니다.</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-foreground text-sm font-semibold">코칭</h2>

      {coaching.strongLeads.length > 0 && (
        <p className="text-sm">
          <span className="text-primary font-medium">잘 통하는 선발</span>{' '}
          <span className="text-muted-foreground">
            {coaching.strongLeads.map((row) => `${row.lead} ${row.winRate}%`).join(', ')}
          </span>
        </p>
      )}
      {coaching.weakLeads.length > 0 && (
        <p className="text-sm">
          <span className="text-destructive font-medium">안 통하는 선발</span>{' '}
          <span className="text-muted-foreground">
            {coaching.weakLeads.map((row) => `${row.lead} ${row.winRate}%`).join(', ')}
          </span>
        </p>
      )}

      {coaching.weakOpponents.length === 0 ? (
        <p className="text-muted-foreground text-sm">표본이 충분한 약점 상대가 아직 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-foreground text-sm font-medium">약점 상대 선발</p>
          {coaching.weakOpponents.map((row) => (
            <div key={row.opponent} className="border-border rounded-md border px-3 py-2">
              <p className="text-sm">
                <span className="text-destructive font-semibold">{row.opponent}</span>{' '}
                <span className="text-muted-foreground">
                  {row.winRate}% ({row.wins}/{row.games})
                </span>
              </p>
              <CounterLookup opponent={row.opponent} pool={pool} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
