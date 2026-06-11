import { type FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/common/ui/Button';
import { Card } from '@/common/ui/Card';
import { Input } from '@/common/ui/Input';
import { Select } from '@/common/ui/Select';
import { useAuthStore } from '@/features/auth';
import { type BattleGimmick, type BattleResult } from '@/features/battle-log/api';
import { useBattleLogs } from '@/features/battle-log/model/useBattleLogs';
import { useBattleStats } from '@/features/battle-log/model/useBattleStats';
import { useCreateBattleLog } from '@/features/battle-log/model/useCreateBattleLog';
import { useDeleteBattleLog } from '@/features/battle-log/model/useDeleteBattleLog';
import { type CounterPoolMon } from '@/features/counter/api';
import { POKEMON_DATALIST_ID, PokemonDatalist } from '@/features/pokemon-picker/ui/PokemonDatalist';
import { usePresets } from '@/features/presets/model/usePresets';

import { CoachingPanel } from './CoachingPanel';

const GIMMICK_OPTIONS = [
  { value: 'none', label: '안 씀' },
  { value: 'mega', label: '메가' },
  { value: 'tera', label: '테라' },
] as const;

const RESULT_OPTIONS = [
  { value: 'win', label: '승' },
  { value: 'loss', label: '패' },
] as const;

const GIMMICK_LABEL: Record<BattleGimmick, string> = { none: '기믹 없음', mega: '메가', tera: '테라' };
const formatDate = (iso: string): string => new Date(iso).toLocaleDateString('ko-KR');

export const LogPage = () => {
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));
  const logs = useBattleLogs();
  const stats = useBattleStats();
  const create = useCreateBattleLog();
  const remove = useDeleteBattleLog();
  const presets = usePresets();
  // 카운터 조회용 풀: 저장한 프리셋의 포켓몬을 종족 단위로 중복 제거해 모은다.
  const pool = useMemo<CounterPoolMon[]>(() => {
    const seen = new Set<string>();
    const result: CounterPoolMon[] = [];
    for (const preset of presets.data ?? []) {
      for (const member of preset.party) {
        const species = member.species.trim();
        if (species && !seen.has(species)) {
          seen.add(species);
          result.push({ species, moves: member.moves.filter(Boolean) });
        }
      }
    }
    return result;
  }, [presets.data]);

  const [myLead, setMyLead] = useState('');
  const [opponentLead, setOpponentLead] = useState('');
  const [gimmick, setGimmick] = useState<BattleGimmick>('none');
  const [result, setResult] = useState<BattleResult>('win');
  const [memo, setMemo] = useState('');

  if (!isLoggedIn) {
    return (
      <Card>
        <p className="text-muted-foreground text-sm">로그인하면 대전 결과를 기록하고 승률 통계를 볼 수 있어요.</p>
      </Card>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!myLead.trim() || !opponentLead.trim()) {
      toast.error('내 선발과 상대 선발을 입력하세요');
      return;
    }
    create.mutate(
      { myLead: myLead.trim(), opponentLead: opponentLead.trim(), gimmick, result, memo: memo.trim() || undefined },
      {
        onSuccess: () => {
          setMyLead('');
          setOpponentLead('');
          setGimmick('none');
          setResult('win');
          setMemo('');
        },
      },
    );
  };

  const summary = stats.data;
  const items = logs.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-lg font-semibold">배틀 로그</h1>

      <PokemonDatalist />
      <Card className="flex flex-col gap-3">
        <h2 className="text-foreground text-sm font-semibold">결과 기록</h2>
        <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-2">
          <Input
            list={POKEMON_DATALIST_ID}
            value={myLead}
            onChange={(event) => setMyLead(event.target.value)}
            placeholder="내 선발"
            maxLength={50}
          />
          <Input
            list={POKEMON_DATALIST_ID}
            value={opponentLead}
            onChange={(event) => setOpponentLead(event.target.value)}
            placeholder="상대 선발"
            maxLength={50}
          />
          <Select
            value={gimmick}
            onValueChange={(value) => setGimmick(value as BattleGimmick)}
            options={GIMMICK_OPTIONS}
          />
          <Select value={result} onValueChange={(value) => setResult(value as BattleResult)} options={RESULT_OPTIONS} />
          <Input
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="메모 (선택)"
            maxLength={300}
            className="sm:col-span-2"
          />
          <Button type="submit" size="sm" disabled={create.isPending} className="sm:col-span-2">
            {create.isPending ? '기록 중...' : '기록'}
          </Button>
        </form>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-foreground text-sm font-semibold">통계</h2>
        {!summary || summary.total === 0 ? (
          <p className="text-muted-foreground text-sm">아직 기록이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-foreground text-sm">
              전체 <span className="text-primary text-lg font-semibold">{summary.winRate}%</span> ({summary.wins}승{' '}
              {summary.total - summary.wins}패 / {summary.total}판)
            </p>
            {summary.byLead.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs">내 선발별</p>
                <ul className="flex flex-col gap-0.5 text-sm">
                  {summary.byLead.map((row) => (
                    <li key={row.lead} className="flex justify-between gap-2">
                      <span className="text-foreground truncate">{row.lead}</span>
                      <span className="text-muted-foreground shrink-0">
                        {row.winRate}% ({row.wins}/{row.games})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summary.vsOpponent.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs">상대 선발별</p>
                <ul className="flex flex-col gap-0.5 text-sm">
                  {summary.vsOpponent.map((row) => (
                    <li key={row.opponent} className="flex justify-between gap-2">
                      <span className="text-foreground truncate">{row.opponent}</span>
                      <span className="text-muted-foreground shrink-0">
                        {row.winRate}% ({row.wins}/{row.games})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      {stats.data && <CoachingPanel stats={stats.data} pool={pool} />}

      <Card className="flex flex-col gap-2">
        <h2 className="text-foreground text-sm font-semibold">기록 목록</h2>
        {logs.isLoading ? (
          <p className="text-muted-foreground text-sm">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">기록이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {items.map((log) => (
              <li
                key={log.id}
                className="border-border flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span
                    className={log.result === 'win' ? 'text-primary font-semibold' : 'text-destructive font-semibold'}
                  >
                    {log.result === 'win' ? '승' : '패'}
                  </span>{' '}
                  <span className="text-foreground">
                    {log.myLead} vs {log.opponentLead}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {GIMMICK_LABEL[log.gimmick]} · {formatDate(log.playedAt)}
                  </span>
                  {log.memo && <span className="text-muted-foreground block truncate text-xs">{log.memo}</span>}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove.mutate(log.id)}
                  disabled={remove.isPending}
                  className="shrink-0"
                >
                  삭제
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
