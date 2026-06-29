import { describe, expect, it } from 'vitest';

import { optimizeBulk, optimizePower, optimizeSpeed } from './optimize';

const NEUTRAL = '노력' as const;

describe('스피드 역산', () => {
  it('목표가 아주 낮으면 0 투자로 추월한다', () => {
    const result = optimizeSpeed({
      species: '한카리아스',
      level: 50,
      nature: NEUTRAL,
      itemMultiplier: 1,
      abilityMultiplier: 1,
      targetSpeed: 1,
    });
    expect(result?.evNeeded).toBe(0);
  });

  it('목표가 최대 스피드 이상이면 추월 불가(null)', () => {
    const result = optimizeSpeed({
      species: '한카리아스',
      level: 50,
      nature: NEUTRAL,
      itemMultiplier: 1,
      abilityMultiplier: 1,
      targetSpeed: 99999,
    });
    expect(result?.evNeeded).toBeNull();
    expect(result?.achievedSpeed).toBe(result?.maxSpeed);
  });

  it('투자가 늘수록 최대 스피드가 목표 직전 스피드보다 빠르다(단조 증가)', () => {
    const result = optimizeSpeed({
      species: '한카리아스',
      level: 50,
      nature: NEUTRAL,
      itemMultiplier: 1,
      abilityMultiplier: 1,
      targetSpeed: 100,
    });
    expect(result?.maxSpeed).toBeGreaterThanOrEqual(result?.achievedSpeed ?? 0);
  });
});

describe('내구 역산', () => {
  it('위력 1짜리 공격은 0 투자로 버틴다', () => {
    const result = optimizeBulk({
      defenderSpecies: '한카리아스',
      defenderLevel: 50,
      defenderNature: NEUTRAL,
      attackerSpecies: '한카리아스',
      attackerLevel: 50,
      attackerNature: NEUTRAL,
      attackerEv: 0,
      attack: {
        level: 50,
        category: '물리',
        moveType: '노말',
        movePower: 1,
        itemMultiplier: 1,
        terastalized: false,
        teraType: '노말',
      },
      hits: 1,
    });
    expect(result?.canSurvive).toBe(true);
    expect(result?.best?.total).toBe(0);
    expect(result?.best?.takenPercent).toBeLessThan(100);
  });
});

describe('화력 역산', () => {
  it('위력 1짜리 공격은 최대 투자로도 1타가 안 난다(null)', () => {
    const result = optimizePower({
      attackerSpecies: '한카리아스',
      attackerLevel: 50,
      attackerNature: NEUTRAL,
      attack: {
        level: 50,
        category: '물리',
        moveType: '노말',
        movePower: 1,
        itemMultiplier: 1,
        terastalized: false,
        teraType: '노말',
      },
      defenderSpecies: '한카리아스',
      defenderLevel: 50,
      defenderNature: NEUTRAL,
      defenderHpEv: 32,
      defenderDefEv: 32,
      targetHits: 1,
      guaranteed: true,
    });
    expect(result?.evNeeded).toBeNull();
  });

  it('고위력 공격은 적은 투자로 목표 타수를 만족한다', () => {
    const result = optimizePower({
      attackerSpecies: '한카리아스',
      attackerLevel: 50,
      attackerNature: NEUTRAL,
      attack: {
        level: 50,
        category: '물리',
        moveType: '땅',
        movePower: 120,
        itemMultiplier: 1,
        terastalized: false,
        teraType: '땅',
      },
      defenderSpecies: '한카리아스',
      defenderLevel: 50,
      defenderNature: NEUTRAL,
      defenderHpEv: 0,
      defenderDefEv: 0,
      targetHits: 3,
      guaranteed: true,
    });
    expect(result?.evNeeded).not.toBeNull();
    expect(result?.evNeeded).toBeGreaterThanOrEqual(0);
  });
});
