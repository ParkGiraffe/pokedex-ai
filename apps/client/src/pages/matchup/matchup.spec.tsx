import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { rootRoute } from '@/routes/__root';
import { matchupRoute } from '@/routes/matchup';

// 탭 셸이 라우트 search(?tab=)를 읽으므로 실제 라우터로 감싸 렌더한다.
const renderPage = (initial: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider
        router={createRouter({
          routeTree: rootRoute.addChildren([matchupRoute]),
          history: createMemoryHistory({ initialEntries: [initial] }),
        })}
      />
    </QueryClientProvider>,
  );

describe('선출 페이지', () => {
  it('기본 파티와 상대로 매트릭스를 렌더한다', async () => {
    renderPage('/matchup');
    expect(await screen.findByRole('heading', { name: '선출', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/매치업 매트릭스/)).toBeInTheDocument();
    expect(screen.getByText(/선두 추천 점수/)).toBeInTheDocument();
  });

  it('상성표 탭으로 전환하면 팀 입력 카드를 렌더한다', async () => {
    renderPage('/matchup?tab=matrix');
    expect(await screen.findByRole('heading', { name: '선출', level: 1 })).toBeInTheDocument();
    expect(screen.queryByText(/선두 추천 점수/)).not.toBeInTheDocument();
  });
});
