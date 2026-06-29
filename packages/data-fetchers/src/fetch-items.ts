import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { announce, concurrency, fetchJson, pickKo } from './pokeapi';

type ItemListResponse = {
  count: number;
};

type ItemResponse = {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
  category: { name: string };
  attributes: Array<{ name: string }>;
  flavor_text_entries: Array<{
    language: { name: string };
    text: string;
    version_group: { name: string };
  }>;
};

const OUT = resolve(import.meta.dirname, '../../pokedex-core/data/items.json');

const BATTLE_CATEGORIES = new Set([
  'held-items',
  'choice',
  'type-enhancement',
  'stat-boosts',
  'training',
  'plates',
  'mega-stones',
  'memories',
  'z-crystals',
  'species-specific',
  'type-protection',
  'all-mail',
  'in-a-pinch',
  'picky-healing',
  'type-boosters',
  'loot',
  'bad-held-items',
  'effort-training',
]);

const main = async () => {
  const list = await fetchJson<ItemListResponse>('/item/?limit=1');
  const total = list.count;
  process.stderr.write(`[1/1] items 1..${total}\n`);

  const items: Array<Record<string, unknown>> = [];
  let done = 0;
  await Promise.all(
    Array.from({ length: total }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        try {
          const data = await fetchJson<ItemResponse>(`/item/${i}/`);
          if (!BATTLE_CATEGORIES.has(data.category.name)) {
            return;
          }
          const ko = pickKo(data.names);
          if (!ko) return;
          const flavorKo = data.flavor_text_entries.find(
            (f) => f.language.name === 'ko' && f.version_group.name === 'scarlet-violet',
          )?.text;
          items.push({
            id: data.id,
            ko,
            en: data.name,
            category: data.category.name,
            flavor_ko: flavorKo ?? null,
          });
        } catch (e) {
          process.stderr.write(`[skip item ${i}]: ${String(e)}\n`);
        }
        announce('items', ++done, total);
      }),
    ),
  );

  items.sort((a, b) => Number(a.id) - Number(b.id));

  writeFileSync(
    OUT,
    JSON.stringify(
      {
        source: 'PokeAPI v2',
        generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
        count: items.length,
        items,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  process.stderr.write(`[done] ${OUT} (${items.length} items)\n`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
