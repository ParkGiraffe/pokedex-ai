import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { fetchJson } from './pokeapi';

const FORMATS = ['gen9ou', 'gen9ubers'];
const BASE = 'https://data.pkmn.cc/stats';
const OUT = resolve(import.meta.dirname, '../../pokedex-core/data/gen9-fallback/usage-gen9.json');
const TOP = 8;

const toShowdownId = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '');

type SpeciesStats = {
  usage?: { weighted?: number; real?: number; raw?: number };
  abilities?: Record<string, number>;
  items?: Record<string, number>;
  teraTypes?: Record<string, number>;
  spreads?: Record<string, number>;
  moves?: Record<string, number>;
  teammates?: Record<string, number>;
};

type StatsFile = { pokemon: Record<string, SpeciesStats> };

const topN = (table: Record<string, number> | undefined, n = TOP): Array<[string, number]> =>
  Object.entries(table ?? {})
    .filter(([name]) => name && name !== 'nothing' && name !== '')
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value]) => [name, Math.round(value * 1000) / 1000]);

const main = async () => {
  mkdirSync(resolve(OUT, '..'), { recursive: true });

  const pokemon: Record<string, unknown> = {};

  for (const format of FORMATS) {
    let data: StatsFile;
    try {
      data = await fetchJson<StatsFile>(`${BASE}/${format}.json`);
    } catch (error) {
      process.stderr.write(`[skip ${format}]: ${String(error)}\n`);
      continue;
    }
    let added = 0;
    for (const [species, stats] of Object.entries(data.pokemon)) {
      const id = toShowdownId(species);
      if (pokemon[id]) {
        continue;
      }
      pokemon[id] = {
        display: species,
        format,
        usage: Math.round((stats.usage?.weighted ?? 0) * 1000) / 1000,
        abilities: topN(stats.abilities),
        items: topN(stats.items),
        teraTypes: topN(stats.teraTypes),
        spreads: topN(stats.spreads, 5),
        moves: topN(stats.moves, 12),
        teammates: topN(stats.teammates),
      };
      added += 1;
    }
    process.stderr.write(`  [${format}] +${added} 종족\n`);
  }

  const sorted = Object.fromEntries(Object.entries(pokemon).sort(([a], [b]) => a.localeCompare(b)));

  const payload = {
    source: 'Smogon chaos via data.pkmn.cc (gen9ou+ubers 병합)',
    generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
    formats: FORMATS,
    count: Object.keys(sorted).length,
    pokemon: sorted,
  };

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  process.stderr.write(`[done] ${OUT} (${payload.count} 종족)\n`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
