import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { announce, concurrency, fetchJson, pickKo } from './pokeapi';

type AbilityListResponse = {
  count: number;
  results: Array<{ name: string; url: string }>;
};

type AbilityResponse = {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
  flavor_text_entries: Array<{
    language: { name: string };
    flavor_text: string;
    version_group: { name: string };
  }>;
  effect_entries: Array<{
    language: { name: string };
    effect: string;
    short_effect: string;
  }>;
};

const OUT = resolve(import.meta.dirname, '../../pokedex-core/data/abilities.json');

const main = async () => {
  const list = await fetchJson<AbilityListResponse>('/ability/?limit=1');
  const total = list.count;
  process.stderr.write(`[1/1] abilities 1..${total}\n`);

  const abilities: Array<Record<string, unknown>> = [];
  let done = 0;
  await Promise.all(
    Array.from({ length: total }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        try {
          const data = await fetchJson<AbilityResponse>(`/ability/${i}/`);
          const ko = pickKo(data.names);
          if (!ko) return;
          const flavorKo = data.flavor_text_entries.find(
            (f) => f.language.name === 'ko' && f.version_group.name === 'scarlet-violet',
          )?.flavor_text;
          abilities.push({
            id: data.id,
            ko,
            en: data.name,
            flavor_ko: flavorKo ?? null,
          });
        } catch (e) {
          process.stderr.write(`[skip ability ${i}]: ${String(e)}\n`);
        }
        announce('abilities', ++done, total);
      }),
    ),
  );

  abilities.sort((a, b) => Number(a.id) - Number(b.id));

  writeFileSync(
    OUT,
    JSON.stringify(
      {
        source: 'PokeAPI v2',
        generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
        count: abilities.length,
        abilities,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  process.stderr.write(`[done] ${OUT} (${abilities.length} abilities)\n`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
