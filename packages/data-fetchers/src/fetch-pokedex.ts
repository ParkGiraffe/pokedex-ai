import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { announce, concurrency, fetchJson, generationToInt, pickKo } from './pokeapi';

const TOTAL = 1025;
const TYPE_COUNT = 18;

type SpeciesResponse = {
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
  generation: { name: string };
};

type PokemonResponse = {
  name: string;
  types: Array<{ slot: number; type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  past_types: Array<{
    generation: { name: string };
    types: Array<{ slot: number; type: { name: string } }>;
  }>;
};

type BaseStats = { H: number; A: number; B: number; C: number; D: number; S: number };

const STAT_KEY: Record<string, keyof BaseStats> = {
  hp: 'H',
  attack: 'A',
  defense: 'B',
  'special-attack': 'C',
  'special-defense': 'D',
  speed: 'S',
};

const toBaseStats = (stats: PokemonResponse['stats']): BaseStats => {
  const base: Partial<BaseStats> = {};
  for (const s of stats) {
    const key = STAT_KEY[s.stat.name];
    if (key) base[key] = s.base_stat;
  }
  const keys: Array<keyof BaseStats> = ['H', 'A', 'B', 'C', 'D', 'S'];
  for (const key of keys) {
    if (base[key] === undefined) throw new Error(`종족값 누락: ${key}`);
  }
  return base as BaseStats;
};

type TypeResponse = {
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
};

const OUT = resolve(import.meta.dirname, '../../pokedex-core/data/pokedex.json');

const main = async () => {
  process.stderr.write('[1/3] type map\n');
  const typeResults = await Promise.all(
    Array.from({ length: TYPE_COUNT }, (_, i) => i + 1).map((i) =>
      concurrency(() => fetchJson<TypeResponse>(`/type/${i}/`)),
    ),
  );
  const typeMap: Record<string, string> = {};
  for (const data of typeResults) {
    const ko = pickKo(data.names);
    if (!ko) throw new Error(`타입 한국어명 누락: ${data.name}`);
    typeMap[data.name] = ko;
  }

  process.stderr.write(`[2/3] species 1..${TOTAL}\n`);
  const species: Record<number, { ko: string; generation: number }> = {};
  let done = 0;
  await Promise.all(
    Array.from({ length: TOTAL }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        const data = await fetchJson<SpeciesResponse>(`/pokemon-species/${i}/`);
        const ko = pickKo(data.names);
        if (!ko) throw new Error(`#${i} 한국어명 누락`);
        species[i] = { ko, generation: generationToInt(data.generation.name) };
        announce('species', ++done, TOTAL);
      }),
    ),
  );

  process.stderr.write(`[3/3] pokemon 1..${TOTAL}\n`);
  const pokemon: Record<number, { en: string; types_en: string[]; base: BaseStats; past_types: unknown[] }> = {};
  done = 0;
  await Promise.all(
    Array.from({ length: TOTAL }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        const data = await fetchJson<PokemonResponse>(`/pokemon/${i}/`);
        const types_en = [...data.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name);
        const past_types = data.past_types.map((pt) => ({
          until_generation: generationToInt(pt.generation.name),
          types_en: [...pt.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
        }));
        pokemon[i] = { en: data.name, types_en, base: toBaseStats(data.stats), past_types };
        announce('pokemon', ++done, TOTAL);
      }),
    ),
  );

  const entries = Array.from({ length: TOTAL }, (_, i) => {
    const idx = i + 1;
    const sp = species[idx]!;
    const pk = pokemon[idx]!;
    return {
      no: idx,
      ko: sp.ko,
      en: pk.en,
      generation: sp.generation,
      types: pk.types_en.map((t) => typeMap[t] ?? t),
      types_en: pk.types_en,
      base: pk.base,
      past_types: (pk.past_types as Array<{ until_generation: number; types_en: string[] }>).map((p) => ({
        until_generation: p.until_generation,
        types: p.types_en.map((t) => typeMap[t] ?? t),
        types_en: p.types_en,
      })),
    };
  });

  const payload = {
    source: 'PokeAPI v2 (pokeapi.co)',
    generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
    generations: '1-9',
    count: entries.length,
    type_map_ko: typeMap,
    entries,
  };

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  process.stderr.write(`[done] ${OUT} (${entries.length} entries)\n`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
