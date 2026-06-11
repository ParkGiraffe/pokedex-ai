import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildParty } from '@/pages/party/lib/party';
import { usePartyStore } from '@/pages/party/model/store';

import { battleOptions } from './lib/battle';
import { BattlePage } from './ui/BattlePage';

describe('배틀 페이지', () => {
  it('기술 옵션 표를 렌더한다', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <BattlePage />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('heading', { name: '배틀' })).toBeInTheDocument();
    expect(screen.getByText(/KO 확률은 16롤 기준/)).toBeInTheDocument();
  });

  it('내 액티브의 기술 옵션과 KO 확률을 계산한다', () => {
    const myParty = buildParty(usePartyStore.getState().members);
    const options = battleOptions({
      myParty,
      myActiveIndex: 0,
      opponentSpecies: '마기라스',
      opponentHpPercent: 100,
      weather: '',
      trickRoom: false,
      turn: 1,
      myMegaForm: '',
      opponentMegaForm: '',
      myRanks: { A: 0, B: 0, C: 0, D: 0, S: 0 },
      opponentRanks: { A: 0, B: 0, C: 0, D: 0, S: 0 },
      myStatus: '',
      opponentStatus: '',
      rosterSpecies: [],
      field: {
        myStealthRock: false,
        mySpikes: 0,
        myStickyWeb: false,
        opponentLightScreen: false,
        opponentReflect: false,
        myTailwind: false,
        opponentTailwind: false,
      },
    });
    expect(options).toHaveLength(4);
    expect(options?.every((option) => option.koChance >= 0 && option.koChance <= 1)).toBe(true);
  });
});
