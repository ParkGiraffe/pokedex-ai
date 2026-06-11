import { describe, expect, it } from 'vitest';

import { hasMeta, smogonSets, smogonUsage } from '../src/gen9-fallback';
import { showdownIdOf, toShowdownId } from '../src/showdown';

describe('Showdown ID 브리지', () => {
  it('표시명을 id로 정규화한다', () => {
    expect(toShowdownId('Great Tusk')).toBe('greattusk');
    expect(toShowdownId('Urshifu-Rapid-Strike')).toBe('urshifurapidstrike');
  });

  it('한국어명을 Showdown id로 매핑한다', () => {
    expect(showdownIdOf('위대한엄니')).toBe('greattusk');
    expect(showdownIdOf('한카리아스')).toBe('garchomp');
  });
});

describe('Smogon 메타 조회', () => {
  it('한국어명으로 샘플 세트를 찾는다', () => {
    expect(smogonSets('위대한엄니').length).toBeGreaterThan(0);
    expect(smogonSets('한카리아스').length).toBeGreaterThan(0);
  });

  it('사용률·테라 분포를 돌려준다', () => {
    const usage = smogonUsage('위대한엄니');
    expect(usage?.usage).toBeGreaterThan(0);
    expect(usage?.teraTypes.length).toBeGreaterThan(0);
  });

  it('메타에 없는 종족은 빈 결과를 준다', () => {
    expect(smogonSets('없는포켓몬')).toHaveLength(0);
    expect(hasMeta('없는포켓몬')).toBe(false);
    expect(hasMeta('위대한엄니')).toBe(true);
  });
});
