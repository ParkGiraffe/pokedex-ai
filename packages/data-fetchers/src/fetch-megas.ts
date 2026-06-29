import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { PokedexEntry } from '@pokedex-agent/pokedex-core';

import { announce, concurrency, fetchJson, pickKo } from './pokeapi';

const CORE = resolve(import.meta.dirname, '../../pokedex-core/data');
const SAMPLES_PATH = resolve(CORE, 'champions/samples-singles.json');
const OUT = resolve(CORE, 'champions/megas.json');

const TYPE_KO_FALLBACK: Record<string, string> = {
  normal: '노말',
  fire: '불꽃',
  water: '물',
  grass: '풀',
  electric: '전기',
  ice: '얼음',
  fighting: '격투',
  poison: '독',
  ground: '땅',
  flying: '비행',
  psychic: '에스퍼',
  bug: '벌레',
  rock: '바위',
  ghost: '고스트',
  dragon: '드래곤',
  dark: '악',
  steel: '강철',
  fairy: '페어리',
};

type PokemonForm = {
  id: number;
  name: string;
  form_name: string;
  pokemon: { name: string; url: string };
  types: Array<{ slot: number; type: { name: string } }>;
  form_names: Array<{ language: { name: string }; name: string }>;
};

type Pokemon = {
  id: number;
  name: string;
  types: Array<{ slot: number; type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  abilities: Array<{ ability: { name: string; url: string }; is_hidden: boolean; slot: number }>;
  species: { name: string; url: string };
};

type Species = {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
};

type AbilityResource = {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
};

type TypeResource = {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
};

const parseMegaForm = (form: string): { megaForme: 'X' | 'Y' | null } | undefined => {
  if (form.endsWith('-mega-x')) {
    return { megaForme: 'X' };
  }
  if (form.endsWith('-mega-y')) {
    return { megaForme: 'Y' };
  }
  if (form.endsWith('-mega')) {
    return { megaForme: null };
  }
  return undefined;
};

const formToStone = (form: string): string => {
  const match = form.match(/^(.+)-mega(?:-([xy]))?$/);
  if (!match) {
    return form;
  }
  const base = match[1]!;
  const suffix = match[2];
  return suffix ? `${base}ite-${suffix}` : `${base}ite`;
};

const STAT_KEY_MAP: Record<string, 'H' | 'A' | 'B' | 'C' | 'D' | 'S'> = {
  hp: 'H',
  attack: 'A',
  defense: 'B',
  'special-attack': 'C',
  'special-defense': 'D',
  speed: 'S',
};

const baseStatBlock = (stats: Pokemon['stats']) => {
  const block: Record<'H' | 'A' | 'B' | 'C' | 'D' | 'S', number> = { H: 0, A: 0, B: 0, C: 0, D: 0, S: 0 };
  for (const entry of stats) {
    const key = STAT_KEY_MAP[entry.stat.name];
    if (key) {
      block[key] = entry.base_stat;
    }
  }
  return block;
};

const baseNoFromSpeciesUrl = (url: string): number => {
  const match = url.match(/\/pokemon-species\/(\d+)\/?$/);
  if (!match) {
    throw new Error(`species URL 파싱 실패: ${url}`);
  }
  return Number(match[1]);
};

type MegaEntry = {
  stone: string;
  form: string;
  baseNo: number;
  baseKo: string;
  ko: string;
  en: string;
  types: PokedexEntry['types'];
  base: PokedexEntry['base'];
  ability: string;
  megaForme: 'X' | 'Y' | null;
};

const buildAbilityKoMap = async (slugs: Iterable<string>): Promise<Map<string, string>> => {
  const unique = [...new Set(slugs)];
  const results = await Promise.all(
    unique.map((slug) =>
      concurrency(async () => {
        try {
          const data = await fetchJson<AbilityResource>(`/ability/${slug}/`);
          return [slug, pickKo(data.names) ?? slug] as const;
        } catch {
          return [slug, slug] as const;
        }
      }),
    ),
  );
  return new Map(results);
};

const buildTypeKoMap = async (): Promise<Map<string, string>> => {
  const results = await Promise.all(
    Object.keys(TYPE_KO_FALLBACK).map((slug) =>
      concurrency(async () => {
        try {
          const data = await fetchJson<TypeResource>(`/type/${slug}/`);
          return [slug, pickKo(data.names) ?? TYPE_KO_FALLBACK[slug]!] as const;
        } catch {
          return [slug, TYPE_KO_FALLBACK[slug]!] as const;
        }
      }),
    ),
  );
  return new Map(results);
};

const main = async () => {
  mkdirSync(resolve(OUT, '..'), { recursive: true });

  const samplesFile = JSON.parse(readFileSync(SAMPLES_PATH, 'utf8')) as {
    byPokemon: Record<string, Array<{ megaForm?: string }>>;
  };
  const forms = new Set<string>();
  for (const samples of Object.values(samplesFile.byPokemon)) {
    for (const sample of samples) {
      if (sample.megaForm) {
        forms.add(sample.megaForm);
      }
    }
  }
  const candidates: Array<{ stone: string; form: string; megaForme: 'X' | 'Y' | null }> = [];
  for (const form of [...forms].sort()) {
    const parsed = parseMegaForm(form);
    if (parsed) {
      candidates.push({ stone: formToStone(form), form, megaForme: parsed.megaForme });
    }
  }
  process.stderr.write(`[fetch-megas] 메가 폼 ${candidates.length}개 (samples 내 form ${forms.size}개)\n`);

  const typeKo = await buildTypeKoMap();

  const megas: MegaEntry[] = [];
  const skipped: Array<{ stone: string; form: string; reason: string }> = [];
  const abilitySlugsToResolve = new Set<string>();
  type Pending = {
    stone: string;
    form: string;
    megaForme: 'X' | 'Y' | null;
    pokemon: Pokemon;
    formData: PokemonForm;
    species: Species;
  };
  const pending: Pending[] = [];

  let done = 0;
  await Promise.all(
    candidates.map((candidate) =>
      concurrency(async () => {
        try {
          const formData = await fetchJson<PokemonForm>(`/pokemon-form/${candidate.form}/`);
          const pokemon = await fetchJson<Pokemon>(`/pokemon/${candidate.form}/`);
          const baseNo = baseNoFromSpeciesUrl(pokemon.species.url);
          const species = await fetchJson<Species>(`/pokemon-species/${baseNo}/`);
          const primary = pokemon.abilities.find((entry) => !entry.is_hidden) ?? pokemon.abilities[0];
          if (primary) {
            abilitySlugsToResolve.add(primary.ability.name);
          }
          pending.push({ ...candidate, pokemon, formData, species });
        } catch (error) {
          skipped.push({ stone: candidate.stone, form: candidate.form, reason: String(error) });
        } finally {
          done += 1;
          announce('megas-fetch', done, candidates.length);
        }
      }),
    ),
  );

  const abilityKo = await buildAbilityKoMap(abilitySlugsToResolve);

  for (const entry of pending) {
    const primary = entry.pokemon.abilities.find((a) => !a.is_hidden) ?? entry.pokemon.abilities[0];
    if (!primary) {
      skipped.push({ stone: entry.stone, form: entry.form, reason: 'abilities 비어있음' });
      continue;
    }
    const baseKo = pickKo(entry.species.names) ?? entry.species.name;
    const formKo = pickKo(entry.formData.form_names);
    const ko = formKo ?? `메가${baseKo}${entry.megaForme ? ` ${entry.megaForme}` : ''}`;
    const types = (entry.formData.types.length > 0 ? entry.formData.types : entry.pokemon.types)
      .sort((a, b) => a.slot - b.slot)
      .map((t) => typeKo.get(t.type.name) ?? TYPE_KO_FALLBACK[t.type.name] ?? t.type.name) as PokedexEntry['types'];
    megas.push({
      stone: entry.stone,
      form: entry.form,
      baseNo: baseNoFromSpeciesUrl(entry.pokemon.species.url),
      baseKo,
      ko,
      en: entry.pokemon.name,
      types,
      base: baseStatBlock(entry.pokemon.stats),
      ability: abilityKo.get(primary.ability.name) ?? primary.ability.name,
      megaForme: entry.megaForme,
    });
  }

  megas.sort((a, b) => a.baseNo - b.baseNo || (a.megaForme ?? '').localeCompare(b.megaForme ?? ''));

  const payload = {
    source: 'pkmnchamps season_allowed(items) + PokeAPI v2 (pokemon-form/pokemon/pokemon-species)',
    generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
    count: megas.length,
    skipped,
    megas,
  };
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  process.stderr.write(
    `[done] ${OUT} (${megas.length}개 수집, ${skipped.length}개 누락: ${skipped.map((s) => s.form).join(', ')})\n`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
