import { describe, expect, it } from 'vitest';

import { allItems } from '../src/lookup';
import { championsItems } from '../src/megas';
import { toShowdownId } from '../src/showdown';

// champions/items.json은 루트 items.json(PokeAPI 공식)을 단일 출처로 비정규화한다.
// 생성기(fetch-champions-items)가 ko를 루트에서 우선 복사하므로, slug가 루트에 있는
// 도구는 메가·비메가 모두 루트와 ko가 일치해야 한다. 재생성 누락 등으로 두 출처가
// 어긋나는 silent drift를 막는다. 루트에 없는 챔피언스 오리지널 메가만 생성기 파생값을 쓴다.
describe('champions 도구 비정규화 정합성', () => {
  it('루트 items.json에 있는 도구의 한글명은 루트와 일치한다', () => {
    const rootKoByEn = new Map(allItems().map((item) => [toShowdownId(item.en), item.ko]));
    const mismatches = championsItems
      .map((item) => ({ slug: item.slug, champions: item.ko, root: rootKoByEn.get(toShowdownId(item.slug)) }))
      .filter((entry) => entry.root !== undefined && entry.root !== entry.champions);

    expect(mismatches).toEqual([]);
  });
});
