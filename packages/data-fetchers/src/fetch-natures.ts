import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { announce, concurrency, fetchJson, pickKo } from './pokeapi';

type NatureResponse = {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
  increased_stat: { name: string } | null;
  decreased_stat: { name: string } | null;
};

// 성격이 보정하는 능력치는 HP를 제외한 5종. PokeAPI 슬러그를 내부 키로 매핑한다.
const STAT_SLUG_TO_KEY: Record<string, 'A' | 'B' | 'C' | 'D' | 'S'> = {
  attack: 'A',
  defense: 'B',
  'special-attack': 'C',
  'special-defense': 'D',
  speed: 'S',
};

const NATURE_COUNT = 25;

const OUT = resolve(import.meta.dirname, '../../pokedex-core/data/natures.json');

const toKey = (stat: { name: string } | null): 'A' | 'B' | 'C' | 'D' | 'S' | null => {
  if (!stat) return null;
  const key = STAT_SLUG_TO_KEY[stat.name];
  if (!key) throw new Error(`알 수 없는 능력치 슬러그: ${stat.name}`);
  return key;
};

const main = async () => {
  const results = await Promise.all(
    Array.from({ length: NATURE_COUNT }, (_, i) => i + 1).map((i) =>
      concurrency(() => fetchJson<NatureResponse>(`/nature/${i}/`)),
    ),
  );

  for (let i = 0; i < results.length; i++) announce('natures', i + 1, NATURE_COUNT);

  const natures = results
    .map((n) => {
      const ko = pickKo(n.names);
      if (!ko) throw new Error(`성격 한국어명 누락: ${n.name}`);
      return {
        id: n.id,
        ko,
        en: n.name,
        up: toKey(n.increased_stat),
        down: toKey(n.decreased_stat),
      };
    })
    .sort((a, b) => a.id - b.id);

  const payload = {
    source: 'PokeAPI v2',
    generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
    count: natures.length,
    natures,
  };

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  process.stderr.write(`[done] ${OUT} (${natures.length} natures)\n`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
