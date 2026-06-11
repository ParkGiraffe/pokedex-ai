import { speciesDisplayName } from '@pokedex-agent/pokedex-core';
import { Grid2x2 } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/common/lib/cn';
import { Badge } from '@/common/ui/Badge';
import { Button } from '@/common/ui/Button';
import { Card } from '@/common/ui/Card';
import { type LeadScore, type Pairwise } from '@/features/matchup-matrix/api';
import { useMatchupMatrix } from '@/features/matchup-matrix/model/useMatchupMatrix';
import { PokemonDatalist } from '@/features/pokemon-picker/ui/PokemonDatalist';
import { PokemonIcon } from '@/features/pokemon-picker/ui/PokemonIcon';

import { MatrixLegend } from './MatrixLegend';
import { TeamInputCard } from './TeamInputCard';

const verdictBadgeVariant = (verdict: Pairwise['verdict']): 'success' | 'destructive' | 'muted' =>
  verdict === '유리' ? 'success' : verdict === '불리' ? 'destructive' : 'muted';

const verdictCellBg = (verdict: Pairwise['verdict']): string =>
  verdict === '유리' ? 'bg-success/10' : verdict === '불리' ? 'bg-destructive/10' : 'bg-muted/30';

const fasterIcon = (faster: Pairwise['faster']): string => (faster === 'win' ? '↑' : faster === 'lose' ? '↓' : '=');

type TeamEntry = { id: number; species: string };

let nextId = 0;
const makeEntry = (species = ''): TeamEntry => ({ id: nextId++, species });

export const MatchupMatrixPage = () => {
  const [myTeam, setMyTeam] = useState<TeamEntry[]>([makeEntry()]);
  const [opponentTeam, setOpponentTeam] = useState<TeamEntry[]>([makeEntry()]);
  const matrix = useMatchupMatrix();

  const handleSetMySpecies = (id: number, species: string) => {
    setMyTeam((prev) => prev.map((entry) => (entry.id === id ? { ...entry, species } : entry)));
  };

  const handleAddMyMon = () => {
    setMyTeam((prev) => [...prev, makeEntry()]);
  };

  const handleRemoveMyMon = (id: number) => {
    setMyTeam((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleSetOpponentSpecies = (id: number, species: string) => {
    setOpponentTeam((prev) => prev.map((entry) => (entry.id === id ? { ...entry, species } : entry)));
  };

  const handleAddOpponent = () => {
    setOpponentTeam((prev) => [...prev, makeEntry()]);
  };

  const handleRemoveOpponent = (id: number) => {
    setOpponentTeam((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleCalculate = () => {
    const validMy = myTeam.filter((e) => e.species.trim().length > 0);
    const validOpp = opponentTeam.filter((e) => e.species.trim().length > 0);
    if (validMy.length === 0 || validOpp.length === 0) {
      return;
    }
    matrix.mutate({
      myTeam: validMy.map((e) => ({ species: e.species.trim() })),
      opponentTeam: validOpp.map((e) => e.species.trim()),
    });
  };

  const validMyCount = myTeam.filter((e) => e.species.trim().length > 0).length;
  const validOppCount = opponentTeam.filter((e) => e.species.trim().length > 0).length;
  const canCalculate = validMyCount > 0 && validOppCount > 0;

  const board = matrix.data?.board ?? [];
  // board가 이미 score 내림차순 정렬(서버 teamSelect가 정렬해서 반환한다)
  const opponents = board[0]?.pairs.map((p) => p.opponent) ?? [];

  return (
    <section className="flex flex-col gap-5">
      <header className="border-border flex flex-wrap items-center gap-3 border-b pb-3">
        <Grid2x2 className="text-primary size-6" />
        <h1 className="text-2xl font-bold tracking-tight">매치업 매트릭스</h1>
        <p className="text-muted-foreground ml-auto text-xs">내 팀 × 상대 팀 결정론적 매트릭스 (AI 없음)</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <TeamInputCard
          title="내 팀"
          team={myTeam}
          removeAriaLabel="내 포켓몬 삭제"
          onSpeciesChange={handleSetMySpecies}
          onAdd={handleAddMyMon}
          onRemove={handleRemoveMyMon}
        />
        <TeamInputCard
          title="상대 팀"
          team={opponentTeam}
          removeAriaLabel="상대 삭제"
          onSpeciesChange={handleSetOpponentSpecies}
          onAdd={handleAddOpponent}
          onRemove={handleRemoveOpponent}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleCalculate} disabled={!canCalculate || matrix.isPending}>
          {matrix.isPending ? '계산 중...' : '매트릭스 계산'}
        </Button>
        {matrix.isError && (
          <p className="text-destructive text-sm">
            {matrix.error instanceof Error ? matrix.error.message : '계산 실패'}
          </p>
        )}
      </div>

      {board.length > 0 && (
        <>
          {matrix.data?.summary && (
            <Card>
              <p className="text-muted-foreground text-sm">{matrix.data.summary}</p>
            </Card>
          )}

          <Card className="flex flex-col gap-4 overflow-x-auto">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">매트릭스</h2>
              <p className="text-muted-foreground text-xs">
                행 = 내 픽 (점수 내림차순) · 열 = 상대 · 셀 = 판정 · KO% · 속도
              </p>
            </div>

            <table className="w-full table-fixed border-collapse text-xs">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground w-36 p-2 text-left text-xs font-medium">내 픽 \ 상대</th>
                  {opponents.map((opp) => (
                    <th key={opp} className="text-foreground min-w-[80px] p-2 align-bottom font-medium">
                      <span className="flex flex-col items-center gap-1">
                        <PokemonIcon species={opp} className="h-8 w-8" />
                        <span className="text-xs">{speciesDisplayName(opp)}</span>
                      </span>
                    </th>
                  ))}
                  <th className="text-muted-foreground w-28 p-2 text-right text-xs font-medium">유리·불리·점수</th>
                </tr>
              </thead>
              <tbody>
                {board.map((row: LeadScore, rowIndex: number) => (
                  <tr key={`${row.myPick}-${rowIndex}`} className="border-border/40 hover:bg-muted/40 border-b">
                    <td className="text-foreground w-36 p-2 font-medium">
                      <span className="flex flex-col items-center gap-1">
                        <PokemonIcon species={row.myPick} className="h-8 w-8" />
                        <span className="text-xs">{speciesDisplayName(row.myPick)}</span>
                        {rowIndex === 0 && (
                          <Badge variant="success" size="sm" className="text-[10px]">
                            추천 선두
                          </Badge>
                        )}
                      </span>
                    </td>
                    {row.pairs.map((pair: Pairwise) => (
                      <td
                        key={pair.opponent}
                        className={cn('align-middle', 'min-w-[80px] p-2', 'text-center', verdictCellBg(pair.verdict))}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <Badge variant={verdictBadgeVariant(pair.verdict)} size="sm">
                            {pair.verdict}
                          </Badge>
                          {pair.myBest && (
                            <span className="text-foreground/70 text-[10px] leading-none tabular-nums">
                              {Math.round(pair.myBest.koChance * 100)}%
                            </span>
                          )}
                          <span
                            className={cn(
                              'text-[10px] leading-none',
                              pair.faster === 'win'
                                ? 'text-success'
                                : pair.faster === 'lose'
                                  ? 'text-destructive'
                                  : 'text-muted-foreground',
                            )}
                          >
                            {fasterIcon(pair.faster)}
                          </span>
                        </div>
                      </td>
                    ))}
                    <td className="w-28 p-2 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs">
                          <span className="text-success">{row.favorable}</span>
                          <span className="text-muted-foreground mx-0.5">·</span>
                          <span className="text-destructive">{row.unfavorable}</span>
                        </span>
                        <Badge variant="muted" size="sm">
                          {row.score.toFixed(2)}점
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <MatrixLegend />
        </>
      )}

      <PokemonDatalist />
    </section>
  );
};
