import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { fetchJson } from './pokeapi';

// gen9 싱글 포맷들의 Smogon 세트를 병합한다. BSS 전용 세트는 Smogon에 없으므로
// 경쟁 메타 전반(OU~AG)의 세트를 "흔한 샘플 세트" 라이브러리로 모은다(파훼·EV 가정용).
const FORMATS = [
  'gen9ou',
  'gen9ubers',
  'gen9uu',
  'gen9ru',
  'gen9nu',
  'gen9pu',
  'gen9monotype',
  'gen91v1',
  'gen9anythinggoes',
  'gen9lc',
];

const BASE = 'https://data.pkmn.cc/sets';
const OUT = resolve(import.meta.dirname, '../../pokedex-core/data/gen9-fallback/sets-gen9.json');

const toShowdownId = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '');

type RawSet = {
  level?: number;
  ability?: string | string[];
  item?: string | string[];
  nature?: string | string[];
  moves: Array<string | string[]>;
  evs?: Record<string, number>;
  ivs?: Record<string, number>;
  teratypes?: string | string[];
};

type FormatSets = Record<string, Record<string, RawSet>>;

type StoredSet = RawSet & { format: string; name: string };

const main = async () => {
  mkdirSync(resolve(OUT, '..'), { recursive: true });

  const sets: Record<string, { display: string; sets: StoredSet[] }> = {};

  for (const format of FORMATS) {
    let data: FormatSets;
    try {
      data = await fetchJson<FormatSets>(`${BASE}/${format}.json`);
    } catch (error) {
      process.stderr.write(`[skip ${format}]: ${String(error)}\n`);
      continue;
    }
    let speciesCount = 0;
    for (const [species, namedSets] of Object.entries(data)) {
      const id = toShowdownId(species);
      sets[id] ??= { display: species, sets: [] };
      for (const [name, set] of Object.entries(namedSets)) {
        sets[id].sets.push({ format, name, ...set });
      }
      speciesCount += 1;
    }
    process.stderr.write(`  [${format}] ${speciesCount} 종족\n`);
  }

  const sortedSets = Object.fromEntries(Object.entries(sets).sort(([a], [b]) => a.localeCompare(b)));

  const payload = {
    source: 'Smogon via data.pkmn.cc',
    generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
    formats: FORMATS,
    count: Object.keys(sortedSets).length,
    sets: sortedSets,
  };

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  process.stderr.write(`[done] ${OUT} (${payload.count} 종족)\n`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
