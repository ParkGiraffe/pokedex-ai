import { describe, expect, it } from 'vitest';

import { parsePartyImport } from './import';

describe('parsePartyImport', () => {
  it('JSON 파티를 빌더 드래프트로 변환한다', () => {
    const json = JSON.stringify([
      {
        species: '한카리아스',
        ability: '까칠한피부',
        item: '기합의띠',
        nature: '고집',
        moves: ['지진', '역린'],
        evs: { A: 32, S: 32, H: 1 },
      },
    ]);
    const [member] = parsePartyImport(json);
    expect(member!.species).toBe('한카리아스');
    expect(member!.moves).toEqual(['지진', '역린', '', '']);
    expect(member!.evs.A).toBe(32);
    expect(member!.evs.S).toBe(32);
    expect(member!.item).toBe('기합의띠');
  });

  it('노력 포인트는 0~32로 클램프한다', () => {
    const [member] = parsePartyImport('[{"species":"피카츄","evs":{"S":999}}]');
    expect(member!.evs.S).toBe(32);
  });

  it('배열이 아니거나 종족이 없으면 던진다', () => {
    expect(() => parsePartyImport('{"species":"x"}')).toThrow();
    expect(() => parsePartyImport('[{"ability":"x"}]')).toThrow();
  });
});
