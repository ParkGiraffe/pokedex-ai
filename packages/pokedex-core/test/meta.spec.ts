import { describe, expect, it } from 'vitest';

import { currentMeta, metaSummary, UsageMeta, usageRankOf } from '../src/meta';

describe('메타 데이터', () => {
  it('아직 수집 전이라 null이다', () => {
    expect(currentMeta).toBeNull();
    expect(metaSummary()).toBeNull();
    expect(usageRankOf('한카리아스')).toBeUndefined();
  });

  it('사용률 스키마가 유효한 시즌 데이터를 파싱한다', () => {
    const parsed = UsageMeta.parse({
      season: '2026-S1',
      source: 'Pokemon Home 공식 시즌1 사용률 (단발 수집)',
      entries: [{ rank: 1, species: '어써러셔', usage_rate: 32.5, trend: 'stable' }],
    });
    expect(parsed.entries[0]?.species).toBe('어써러셔');
  });
});
