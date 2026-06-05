import { describe, expect, it } from 'vitest';

import { allItems } from '../src/lookup';
import { championsItems } from '../src/megas';
import { toShowdownId } from '../src/showdown';

// champions/items.json은 루트 items.json을 비정규화(캐시)한다. 비메가 도구의 ko는
// 생성기(fetch-champions-items)가 루트에서 복사하므로 항상 루트와 일치해야 한다.
// 이 테스트는 재생성 누락 등으로 두 출처가 어긋나는 silent drift를 막는다.
// 메가스톤 ko("종족명나이트 X/Y")는 생성기가 독립 파생하므로 루트와 다를 수 있어 제외한다.
describe('champions 도구 비정규화 정합성', () => {
  it('비메가 도구의 한글명은 루트 items.json과 일치한다', () => {
    const rootKoByEn = new Map(allItems().map((item) => [toShowdownId(item.en), item.ko]));
    const mismatches = championsItems
      .filter((item) => !item.isMega)
      .map((item) => ({ slug: item.slug, champions: item.ko, root: rootKoByEn.get(toShowdownId(item.slug)) }))
      .filter((entry) => entry.root !== undefined && entry.root !== entry.champions);

    expect(mismatches).toEqual([]);
  });
});
