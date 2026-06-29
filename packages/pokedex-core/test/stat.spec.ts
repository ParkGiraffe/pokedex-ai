import { describe, expect, it } from 'vitest';

import { actualStat, NATURE_TABLE } from '../src/formula/stat';

describe('실수치 공식', () => {
  it('HP 공식이 표준 케이스를 통과한다', () => {
    expect(actualStat({ stat: 'H', base: 108, iv: 31, ev: 0, level: 50, nature: '노력' })).toBe(183);
  });

  it('물리 공격 공식이 보정 없이 표준 케이스를 통과한다', () => {
    expect(actualStat({ stat: 'A', base: 130, iv: 31, ev: 32, level: 50, nature: '신중' })).toBe(182);
  });

  it('성격 보정이 1.1배 적용된다', () => {
    expect(actualStat({ stat: 'A', base: 130, iv: 31, ev: 32, level: 50, nature: '고집' })).toBe(200);
  });

  it('성격 보정이 0.9배 적용된다', () => {
    expect(actualStat({ stat: 'A', base: 130, iv: 31, ev: 32, level: 50, nature: '차분' })).toBe(163);
  });

  it('껍질몬처럼 HP 종족값이 1이면 항상 1이다', () => {
    expect(actualStat({ stat: 'H', base: 1, iv: 31, ev: 32, level: 50, nature: '노력' })).toBe(1);
  });

  it('NATURE_TABLE이 25개 성격을 가진다', () => {
    expect(Object.keys(NATURE_TABLE)).toHaveLength(25);
  });
});
