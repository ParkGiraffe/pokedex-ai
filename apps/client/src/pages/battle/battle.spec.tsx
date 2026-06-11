import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildParty } from '@/pages/party/lib/party';
import { usePartyStore } from '@/pages/party/model/store';
import { rootRoute } from '@/routes/__root';
import { battleRoute } from '@/routes/battle';

import { battleOptions } from './lib/battle';

// 탭 셸이 라우트 search(?tab=)를 읽으므로 실제 라우터로 감싸 렌더한다.
const renderPage = (initial: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider
        router={createRouter({
          routeTree: rootRoute.addChildren([battleRoute]),
          history: createMemoryHistory({ initialEntries: [initial] }),
        })}
      />
    </QueryClientProvider>,
  );

describe('배틀 페이지', () => {
  it('기술 옵션 표를 렌더한다', async () => {
    renderPage('/battle');
    expect(await screen.findByRole('heading', { name: '배틀' })).toBeInTheDocument();
    expect(screen.getByText(/KO 확률은 16롤 기준/)).toBeInTheDocument();
  });

  it('스크린샷 탭으로 전환하면 기술 옵션 표 대신 업로드 화면을 렌더한다', async () => {
    renderPage('/battle?tab=screenshot');
    expect(await screen.findByRole('heading', { name: '배틀' })).toBeInTheDocument();
    expect(screen.queryByText(/KO 확률은 16롤 기준/)).not.toBeInTheDocument();
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
