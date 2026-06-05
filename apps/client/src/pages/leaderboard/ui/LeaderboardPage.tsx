import { Link } from '@tanstack/react-router';

import { Badge } from '@/common/ui/Badge';
import { Button } from '@/common/ui/Button';
import { Card } from '@/common/ui/Card';
import { PokemonIcon } from '@/features/pokemon-picker/ui/PokemonIcon';
import { useLeaderboard } from '@/features/presets/model/useLeaderboard';

const RANK_STYLES = [
  'bg-yellow-400/20 text-yellow-600 border-yellow-400/40',
  'bg-slate-300/20 text-slate-500 border-slate-300/40',
  'bg-orange-400/20 text-orange-600 border-orange-400/40',
] as const;

const rankStyle = (rank: number): string =>
  rank <= 3 ? (RANK_STYLES[rank - 1] ?? '') : 'bg-muted/40 text-muted-foreground border-border';

export const LeaderboardPage = () => {
  const leaderboard = useLeaderboard();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-foreground text-xl font-bold">인기 파티</h1>
        <p className="text-muted-foreground mt-1 text-sm">복사수 기준 상위 공유 파티 목록입니다.</p>
      </div>

      {leaderboard.isLoading && <p className="text-muted-foreground text-sm">불러오는 중...</p>}

      {leaderboard.isError && (
        <p className="text-destructive text-sm">리더보드를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.</p>
      )}

      {leaderboard.data && leaderboard.data.length === 0 && (
        <p className="text-muted-foreground text-sm">아직 공유된 파티가 없습니다.</p>
      )}

      {leaderboard.data && leaderboard.data.length > 0 && (
        <ol className="flex flex-col gap-3">
          {leaderboard.data.map((entry, index) => {
            const rank = index + 1;
            const previewMembers = entry.party.slice(0, 6);
            return (
              <li key={entry.shareToken}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${rankStyle(rank)}`}
                  >
                    {rank}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-foreground truncate text-sm font-semibold">{entry.name}</p>
                    <div className="flex flex-wrap gap-0.5">
                      {previewMembers.map((member, i) => (
                        <PokemonIcon key={i} species={member.species} className="h-9 w-9" />
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="outline" size="md">
                      {entry.copyCount.toLocaleString()}명이 복사
                    </Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/shared/$token" params={{ token: entry.shareToken }}>
                        보기
                      </Link>
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
