import { type BattleState, type ClaudeResponse } from '@pokedex-agent/pokedex-core';
import { type UseMutationResult } from '@tanstack/react-query';

import { Button } from '@/common/ui/Button';

type BattleHeaderProps = {
  state: BattleState | undefined;
  advise: UseMutationResult<ClaudeResponse, Error, BattleState>;
};

export const BattleHeader = ({ state, advise }: BattleHeaderProps) => (
  <header className="flex flex-wrap items-center justify-between gap-2">
    <h1 className="text-xl font-bold">배틀</h1>
    {state && (
      <Button onClick={() => advise.mutate(state)} disabled={advise.isPending}>
        {advise.isPending ? '추천 중...' : '지금 뭐 할까?'}
      </Button>
    )}
  </header>
);
