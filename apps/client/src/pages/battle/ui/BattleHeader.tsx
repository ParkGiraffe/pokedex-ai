import { type BattleState, type ClaudeResponse } from '@pokedex-agent/pokedex-core';
import { type UseMutationResult } from '@tanstack/react-query';

import { Button } from '@/common/ui/Button';

type BattleHeaderProps = {
  state: BattleState | undefined;
  advise: UseMutationResult<ClaudeResponse, Error, BattleState>;
};

// 페이지 제목은 탭 셸(BattlePage)이 가진다. 여기는 직접 입력 탭의 추천 트리거만 둔다.
export const BattleHeader = ({ state, advise }: BattleHeaderProps) => (
  <div className="flex flex-wrap items-center justify-end gap-2">
    {state && (
      <Button onClick={() => advise.mutate(state)} disabled={advise.isPending}>
        {advise.isPending ? '추천 중...' : '지금 뭐 할까?'}
      </Button>
    )}
  </div>
);
