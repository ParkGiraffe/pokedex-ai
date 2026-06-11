import { type StatusCondition } from '@pokedex-agent/pokedex-core';

import { Card } from '@/common/ui/Card';
import { Field } from '@/common/ui/Field';
import { NumberField } from '@/common/ui/NumberField';
import { Select } from '@/common/ui/Select';

import { type RankBlock } from '../model/store';

const STATUS_OPTIONS: StatusCondition[] = ['화상', '독', '맹독', '마비', '잠듦', '얼음'];
const RANK_KEYS: Array<keyof RankBlock> = ['A', 'B', 'C', 'D', 'S'];
const RANK_LABELS: Record<keyof RankBlock, string> = {
  A: '공격',
  B: '방어',
  C: '특공',
  D: '특방',
  S: '스피드',
};

type RankStatusCardProps = {
  myRanks: RankBlock;
  opponentRanks: RankBlock;
  myStatus: StatusCondition | '';
  opponentStatus: StatusCondition | '';
  onMyRankChange: (stat: keyof RankBlock, value: number) => void;
  onOpponentRankChange: (stat: keyof RankBlock, value: number) => void;
  onMyStatusChange: (status: StatusCondition | '') => void;
  onOpponentStatusChange: (status: StatusCondition | '') => void;
};

export const RankStatusCard = ({
  myRanks,
  opponentRanks,
  myStatus,
  opponentStatus,
  onMyRankChange,
  onOpponentRankChange,
  onMyStatusChange,
  onOpponentStatusChange,
}: RankStatusCardProps) => (
  <Card className="flex flex-col gap-3">
    <h2 className="text-foreground text-sm font-semibold">랭크·상태</h2>
    <div className="grid gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs font-medium">전투 중인 포켓몬</span>
        <div className="grid grid-cols-5 gap-2">
          {RANK_KEYS.map((key) => (
            <label key={key} className="flex flex-col items-center gap-1">
              <span className="text-muted-foreground text-xs">{RANK_LABELS[key]}</span>
              <NumberField
                value={myRanks[key]}
                min={-6}
                max={6}
                onValueChange={(value) => onMyRankChange(key, value)}
              />
            </label>
          ))}
        </div>
        <Field label="상태이상">
          <Select
            value={myStatus}
            onValueChange={(value) => onMyStatusChange(value as StatusCondition | '')}
            options={[
              { value: '', label: '없음' },
              ...STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
            ]}
          />
        </Field>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs font-medium">상대</span>
        <div className="grid grid-cols-5 gap-2">
          {RANK_KEYS.map((key) => (
            <label key={key} className="flex flex-col items-center gap-1">
              <span className="text-muted-foreground text-xs">{RANK_LABELS[key]}</span>
              <NumberField
                value={opponentRanks[key]}
                min={-6}
                max={6}
                onValueChange={(value) => onOpponentRankChange(key, value)}
              />
            </label>
          ))}
        </div>
        <Field label="상태이상">
          <Select
            value={opponentStatus}
            onValueChange={(value) => onOpponentStatusChange(value as StatusCondition | '')}
            options={[
              { value: '', label: '없음' },
              ...STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
            ]}
          />
        </Field>
      </div>
    </div>
    <p className="text-muted-foreground text-xs">
      랭크는 각 능력치 -6~+6. +1 = 1.5배, -1 ≈ 0.67배. 화상이면 물리 공격이 절반.
    </p>
  </Card>
);
