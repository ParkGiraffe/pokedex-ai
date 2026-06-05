import { describe, expect, it } from 'vitest';

import { findMove, findPokemon, fuzzyPokemon } from '../src/lookup';

describe('조회', () => {
  it('한국어명으로 포켓몬을 찾는다', () => {
    expect(findPokemon('피카츄')?.no).toBe(25);
    expect(findPokemon('이상해씨')?.no).toBe(1);
    expect(findPokemon('복숭악동')?.no).toBe(1025);
  });

  it('영문명으로도 찾는다', () => {
    expect(findPokemon('pikachu')?.ko).toBe('피카츄');
  });

  it('도감번호로도 찾는다', () => {
    expect(findPokemon(25)?.ko).toBe('피카츄');
  });

  it('한국어 기술명으로 찾는다', () => {
    const move = findMove('10만볼트');
    expect(move?.type).toBe('전기');
    expect(move?.category).toBe('특수');
  });

  it('퍼지 검색이 오타를 허용한다', () => {
    const results = fuzzyPokemon('피가츄', 3);
    expect(results[0]?.ko).toBe('피카츄');
  });
});
