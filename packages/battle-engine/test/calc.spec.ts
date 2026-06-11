import { describe, expect, it } from 'vitest';

import { calcDamage } from '../src/calc';

describe('@smogon/calc 데미지 래퍼', () => {
  it('한국어 입력으로 데미지를 계산한다', () => {
    const result = calcDamage(
      {
        species: '한카리아스',
        item: '구애스카프',
        nature: '고집',
        evs: { atk: 252, spe: 252 },
        teraType: '땅',
        terastallized: true,
      },
      { species: '라이츄' },
      '지진',
    );
    expect(result.min).toBeGreaterThan(0);
    expect(result.max).toBeGreaterThanOrEqual(result.min);
    expect(result.koChance).toBe(1);
    expect(result.desc).toContain('Earthquake');
  });

  it('타입 면역이면 데미지가 0이다 (전기 → 땅)', () => {
    const result = calcDamage({ species: '피카츄' }, { species: '한카리아스' }, '10만볼트');
    expect(result.max).toBe(0);
    expect(result.koChance).toBe(0);
  });

  it('도구·랭크·날씨를 반영한다', () => {
    const plain = calcDamage(
      { species: '한카리아스', nature: '고집', evs: { atk: 252 } },
      { species: '마기라스' },
      '지진',
    );
    const boosted = calcDamage(
      { species: '한카리아스', nature: '고집', evs: { atk: 252 }, boosts: { atk: 2 } },
      { species: '마기라스' },
      '지진',
    );
    expect(boosted.max).toBeGreaterThan(plain.max);
  });
});
