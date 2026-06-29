import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { announce, concurrency, fetchJson, pickKo } from './pokeapi';

type MoveListResponse = {
  count: number;
  results: Array<{ name: string; url: string }>;
};

type MoveResponse = {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
  type: { name: string };
  damage_class: { name: 'physical' | 'special' | 'status' };
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  generation: { name: string };
  flavor_text_entries: Array<{
    language: { name: string };
    flavor_text: string;
    version_group: { name: string };
  }>;
};

type TypeResponse = {
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
};

const OUT = resolve(import.meta.dirname, '../../pokedex-core/data/moves.json');

const damageClassKo: Record<string, string> = {
  physical: '물리',
  special: '특수',
  status: '변화',
};

const main = async () => {
  process.stderr.write('[1/3] type map\n');
  const typeMap: Record<string, string> = {};
  await Promise.all(
    Array.from({ length: 18 }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        const data = await fetchJson<TypeResponse>(`/type/${i}/`);
        const ko = pickKo(data.names);
        if (ko) typeMap[data.name] = ko;
      }),
    ),
  );

  process.stderr.write('[2/3] move count\n');
  const list = await fetchJson<MoveListResponse>('/move/?limit=1');
  const total = list.count;
  process.stderr.write(`[3/3] moves 1..${total}\n`);

  const moves: Array<Record<string, unknown>> = [];
  let done = 0;
  await Promise.all(
    Array.from({ length: total }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        try {
          const data = await fetchJson<MoveResponse>(`/move/${i}/`);
          const ko = pickKo(data.names);
          if (!ko) return;
          const flavorKo = data.flavor_text_entries.find(
            (f) => f.language.name === 'ko' && f.version_group.name === 'scarlet-violet',
          )?.flavor_text;
          moves.push({
            id: data.id,
            ko,
            en: data.name,
            type: typeMap[data.type.name] ?? data.type.name,
            type_en: data.type.name,
            category: damageClassKo[data.damage_class.name] ?? data.damage_class.name,
            category_en: data.damage_class.name,
            power: data.power,
            accuracy: data.accuracy,
            pp: data.pp,
            priority: data.priority,
            flavor_ko: flavorKo ?? null,
          });
        } catch (e) {
          process.stderr.write(`[skip move ${i}]: ${String(e)}\n`);
        }
        announce('moves', ++done, total);
      }),
    ),
  );

  moves.sort((a, b) => Number(a.id) - Number(b.id));

  writeFileSync(
    OUT,
    JSON.stringify(
      {
        source: 'PokeAPI v2',
        generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
        count: moves.length,
        moves,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  process.stderr.write(`[done] ${OUT} (${moves.length} moves)\n`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
