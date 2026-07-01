import { describe, expect, it } from 'vitest';

import { typeEffectiveness } from '../src/formula/type-effectiveness';

describe('타입 상성', () => {
  it('물이 불꽃에 2배', () => {
    expect(typeEffectiveness('물', ['불꽃'])).toBe(2);
  });

  it('전기는 땅에게 0배', () => {
    expect(typeEffectiveness('전기', ['땅'])).toBe(0);
  });

  it('얼음이 드래곤·비행 복합에 4배', () => {
    expect(typeEffectiveness('얼음', ['드래곤', '비행'])).toBe(4);
  });

  it('불꽃이 물·바위 복합에 0.25배', () => {
    expect(typeEffectiveness('불꽃', ['물', '바위'])).toBeCloseTo(0.25);
  });

  it('같은 타입의 단일은 1배', () => {
    expect(typeEffectiveness('노말', ['노말'])).toBe(1);
  });
});
