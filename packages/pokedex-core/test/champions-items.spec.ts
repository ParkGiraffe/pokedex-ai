import { describe, expect, it } from 'vitest';

import { allItems } from '../src/lookup';
import { championsItems } from '../src/megas';
import { toShowdownId } from '../src/showdown';

describe('champions 도구 비정규화 정합성', () => {
  it('루트 items.json에 있는 도구의 한글명은 루트와 일치한다', () => {
    const rootKoByEn = new Map(allItems().map((item) => [toShowdownId(item.en), item.ko]));
    const mismatches = championsItems
      .map((item) => ({ slug: item.slug, champions: item.ko, root: rootKoByEn.get(toShowdownId(item.slug)) }))
      .filter((entry) => entry.root !== undefined && entry.root !== entry.champions);

    expect(mismatches).toEqual([]);
  });
});
