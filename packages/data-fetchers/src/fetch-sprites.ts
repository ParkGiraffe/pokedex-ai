import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import pLimit from "p-limit";

import { announce, concurrency, fetchJson } from "./pokeapi";

const TOTAL = 1025;

const OUT_DIR = resolve(import.meta.dirname, "../../../apps/client/public/sprites");
const POKEMONDB = "https://img.pokemondb.net/sprites/scarlet-violet/icon";
const POKEAPI_SPRITE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

const downloadLimit = pLimit(12);

type SpeciesResponse = { name: string };

const fetchBuffer = async (url: string): Promise<Buffer | undefined> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "pokedex-agent/sprites" } });
      if (response.status === 404) return undefined;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 400 * (attempt + 1)));
    }
  }
  return undefined;
};

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  process.stderr.write("[1/2] species 슬러그 수집\n");
  const slug: Record<number, string> = {};
  let done = 0;
  await Promise.all(
    Array.from({ length: TOTAL }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        const species = await fetchJson<SpeciesResponse>(`/pokemon-species/${i}/`);
        slug[i] = species.name;
        announce("species", ++done, TOTAL);
      })
    )
  );

  process.stderr.write("[2/2] 아이콘 다운로드 (PokemonDB SV, 폴백 PokeAPI)\n");
  done = 0;
  let fallback = 0;
  const missing: number[] = [];
  await Promise.all(
    Array.from({ length: TOTAL }, (_, i) => i + 1).map((i) =>
      downloadLimit(async () => {
        let buffer = await fetchBuffer(`${POKEMONDB}/${slug[i]}.png`);
        if (!buffer) {
          buffer = await fetchBuffer(`${POKEAPI_SPRITE}/${i}.png`);
          if (buffer) fallback += 1;
        }
        if (!buffer) {
          missing.push(i);
          return;
        }
        writeFileSync(resolve(OUT_DIR, `${i}.png`), buffer);
        announce("icons", ++done, TOTAL);
      })
    )
  );

  process.stderr.write(`[done] ${OUT_DIR} (${done}개 저장, 폴백 ${fallback}개)\n`);
  if (missing.length > 0) {
    process.stderr.write(`[누락] ${missing.join(", ")}\n`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
