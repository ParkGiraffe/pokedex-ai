import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { compareSpeed } from './lib/speed-calc';
import { useSpeedStore } from './model/speed-store';
import { SpeedTab } from './ui/SpeedTab';

const { left, right } = useSpeedStore.getState();

describe('스피드 탭', () => {
  it('선공 판정을 렌더한다', () => {
    render(<SpeedTab />);
    expect(screen.getAllByText(/선공|동률/).length).toBeGreaterThan(0);
  });

  it('더 빠른 쪽이 선공이다', () => {
    const comparison = compareSpeed(left, right, false);
    expect(comparison?.left).toBeGreaterThan(comparison?.right ?? 0);
    expect(comparison?.faster).toBe('left');
  });

  it('트릭룸에선 느린 쪽이 선공이다', () => {
    const comparison = compareSpeed(left, right, true);
    expect(comparison?.faster).toBe('right');
  });
});
