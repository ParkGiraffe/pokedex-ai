import { describe, expect, it } from 'vitest';

import { serializeForClaude } from '../src/export';
import { calculateDamage } from '../src/formula/damage';
import { parseClaudeResponse } from '../src/parse';
import type { Party } from '../src/types';
import fixtures from './fixtures/damage-cases.json' with { type: 'json' };

type DamageCase = {
  id: string;
  input: Parameters<typeof calculateDamage>[0];
  expected: { min: number | null; max: number | null };
};

const cases = (fixtures as unknown as { cases: DamageCase[] }).cases;

describe('Phase 0 통합 검증', () => {
  it('export 출력은 응답 스키마가 아니므로 파싱에 실패한다', () => {
    const party: Party = [
      {
        species: '어써러셔',
        level: 50,
        nature: '신중',
        ability: '재생력',
        item: '돌격조끼',
        teraType: '강철',
        moves: ['지진', '스톤에지', '기합구슬', '탁쳐서떨구기'],
        evs: { H: 32, A: 1, B: 0, C: 0, D: 32, S: 0 },
        ivs: { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 },
      },
    ];

    const text = serializeForClaude('party-analysis', { party });
    const parsed = parseClaudeResponse(text);
    expect(parsed.success).toBe(false);
  });

  it('30개 데미지 케이스가 기준선과 일치한다', () => {
    expect(cases).toHaveLength(30);
    for (const c of cases) {
      const result = calculateDamage(c.input);
      if (c.expected.min === 0) {
        expect(result.max, `case ${c.id}`).toBe(0);
      } else {
        expect(result.max, `case ${c.id}`).toBeGreaterThan(0);
        expect(result.rolls, `case ${c.id}`).toHaveLength(16);
      }
      if (c.expected.min !== null && c.expected.max !== null) {
        expect(result.min, `case ${c.id} min`).toBe(c.expected.min);
        expect(result.max, `case ${c.id} max`).toBe(c.expected.max);
      }
    }
  });

  it('16롤은 단조 증가하며 min과 max가 양 끝이다', () => {
    for (const c of cases) {
      const { rolls, min, max } = calculateDamage(c.input);
      expect(rolls[0], `case ${c.id}`).toBe(min);
      expect(rolls[15], `case ${c.id}`).toBe(max);
      for (let i = 1; i < rolls.length; i++) {
        expect(rolls[i]! >= rolls[i - 1]!, `case ${c.id} roll ${i}`).toBe(true);
      }
    }
  });
});
