import { Card, CardContent, CardHeader, CardTitle } from '@/common/ui/Card';
import { type MetaLeadRecord } from '@/features/meta/api';
import { useMeta } from '@/features/meta/model/useMeta';
import { PokemonIcon } from '@/features/pokemon-picker/ui/PokemonIcon';

const winRateColor = (wr: number): string => {
  if (wr >= 60) {
    return 'text-emerald-500';
  }
  if (wr <= 40) {
    return 'text-rose-500';
  }
  return 'text-foreground';
};

type LeadsTableProps = {
  title: string;
  rows: MetaLeadRecord[];
};

const LeadsTable = ({ title, rows }: LeadsTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-border border-b text-left text-xs">
            <th className="pb-2 font-medium">#</th>
            <th className="pb-2 font-medium">포켓몬</th>
            <th className="pb-2 text-right font-medium">사용률</th>
            <th className="pb-2 text-right font-medium">승률</th>
            <th className="pb-2 text-right font-medium">경기 수</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.species} className="border-border border-b last:border-0">
              <td className="text-muted-foreground py-2 pr-2 text-xs">{index + 1}</td>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <PokemonIcon species={row.species} className="h-8 w-8" />
                  <span className="font-medium">{row.species}</span>
                </div>
              </td>
              <td className="py-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <div className="bg-primary/20 h-1.5 w-16 overflow-hidden rounded-full">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(row.usage, 100)}%` }} />
                  </div>
                  <span className="w-10 text-right">{row.usage.toFixed(1)}%</span>
                </div>
              </td>
              <td className={`py-2 text-right font-semibold ${winRateColor(row.winRate)}`}>
                {row.winRate.toFixed(1)}%
              </td>
              <td className="text-muted-foreground py-2 text-right">{row.games}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent>
  </Card>
);

export const MetaPage = () => {
  const meta = useMeta();

  if (meta.isLoading) {
    return <p className="text-muted-foreground text-sm">불러오는 중...</p>;
  }

  if (meta.isError) {
    return <p className="text-destructive text-sm">메타 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.</p>;
  }

  const data = meta.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-foreground text-xl font-bold">이번 메타</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {data && data.totalGames > 0 ? (
            <>표본 {data.totalGames.toLocaleString()}판</>
          ) : (
            '커뮤니티 전적 기반 포켓몬 챔피언스 메타 분석'
          )}
        </p>
      </div>

      {data && data.totalGames === 0 && (
        <Card>
          <p className="text-muted-foreground py-8 text-center text-sm">
            아직 집계된 전적이 없습니다 — 전적을 기록하면 메타가 쌓입니다
          </p>
        </Card>
      )}

      {data && data.totalGames > 0 && (
        <>
          {data.topLeads.length > 0 && <LeadsTable title="선발 사용률" rows={data.topLeads} />}

          {data.topOpponents.length > 0 && <LeadsTable title="상대 선발" rows={data.topOpponents} />}

          {data.gimmickUsage.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>기믹 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {data.gimmickUsage.map((g) => (
                    <div key={g.gimmick} className="flex items-center gap-3 text-sm">
                      <span className="w-16 font-medium">
                        {g.gimmick === 'none' ? '없음' : g.gimmick === 'mega' ? '메가진화' : '테라스탈'}
                      </span>
                      <div className="bg-muted flex-1 overflow-hidden rounded-full" style={{ height: '6px' }}>
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${Math.min(g.share, 100)}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground w-14 text-right">{g.share.toFixed(1)}%</span>
                      <span className="text-muted-foreground w-12 text-right">{g.games}판</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
