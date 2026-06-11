import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { rootRoute } from '@/routes/__root';
import { calculatorRoute } from '@/routes/calculator';

import { computeCalc } from './lib/calc';
import { useCalculatorStore } from './model/store';

const { attacker, defender } = useCalculatorStore.getState();

// 탭 셸이 라우트 search(?tab=)를 읽으므로 실제 라우터로 감싸 렌더한다.
const renderPage = (initial: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider
        router={createRouter({
          routeTree: rootRoute.addChildren([calculatorRoute]),
          history: createMemoryHistory({ initialEntries: [initial] }),
        })}
      />
    </QueryClientProvider>,
  );

describe('계산기 페이지', () => {
  it('기본 매치업 결과를 렌더한다', async () => {
    renderPage('/');
    expect(await screen.findByRole('heading', { name: '계산기' })).toBeInTheDocument();
    expect(screen.getByText(/상성/)).toBeInTheDocument();
  });

  it('스피드 탭으로 전환하면 스피드 비교를 렌더한다', async () => {
    renderPage('/?tab=speed');
    expect(await screen.findByRole('heading', { name: '계산기' })).toBeInTheDocument();
    expect(screen.queryByText(/상성/)).not.toBeInTheDocument();
  });

  it('땅 기술이 전기 종족에 2배로 들어간다', () => {
    const result = computeCalc({ ...attacker, moveType: '땅' }, { ...defender, species: '라이츄' });
    expect(result?.damage.effectiveness).toBe(2);
    expect(result?.damage.max).toBeGreaterThan(0);
  });

  it('땅 기술은 비행 복합 종족에 0배라 데미지가 없다', () => {
    const result = computeCalc({ ...attacker, moveType: '땅' }, { ...defender, species: '리자몽' });
    expect(result?.damage.effectiveness).toBe(0);
    expect(result?.damage.max).toBe(0);
  });
});
