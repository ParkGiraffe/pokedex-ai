import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { fetchJson } from "./pokeapi";

// 챔피언스 합법 도구(메가 포함)는 pkmnchamps season_allowed가 출처. 한국어 이름은
// 우리 items.json(캐논) + 메가 파생(종족명+나이트) + 빠진 건 PokeAPI로 보충한다.
const SUPABASE = "https://misabaliuftjkqigysvv.supabase.co/rest/v1";
const ANON_KEY =
  process.env.PKMNCHAMPS_ANON_KEY ??
  "[REDACTED-supabase-anon-key]";
const CORE = resolve(import.meta.dirname, "../../pokedex-core/data");
const OUT = resolve(CORE, "champions/items.json");

const toId = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");

type Item = { slug: string; ko: string; isMega: boolean; megaForme?: "X" | "Y" };

const readCoreJson = <T>(name: string, key: string): T[] => {
  const parsed = JSON.parse(readFileSync(resolve(CORE, name), "utf8")) as Record<string, T[]>;
  return parsed[key] ?? [];
};

const itemKoById = new Map<string, string>();
for (const item of readCoreJson<{ ko: string; en: string }>("items.json", "items")) {
  itemKoById.set(toId(item.en), item.ko);
}

const dexKoById = new Map<string, string>();
for (const entry of readCoreJson<{ ko: string; en: string }>("pokedex.json", "entries")) {
  const id = toId(entry.en);
  if (!dexKoById.has(id)) {
    dexKoById.set(id, entry.ko);
  }
  const base = toId(entry.en.split("-")[0] ?? entry.en);
  if (!dexKoById.has(base)) {
    dexKoById.set(base, entry.ko);
  }
}

const matchSpeciesKo = (stem: string): string | undefined => {
  if (dexKoById.has(stem)) {
    return dexKoById.get(stem);
  }
  for (const [id, ko] of dexKoById) {
    if (id.length < 4) {
      continue;
    }
    if (id.startsWith(stem) && (id.length - stem.length <= 2 || stem.length >= 6)) {
      return ko;
    }
    if (stem.startsWith(id) && stem.length - id.length <= 2 && id.length >= 5) {
      return ko;
    }
  }
  return undefined;
};

// 메가스톤 슬러그(예: garchompite, dragonitite, raichunite-x) → 한국어 "종족명나이트 [X/Y]"
const megaOf = (slug: string): { ko: string; megaForme?: "X" | "Y" } | undefined => {
  let core = toId(slug);
  let megaForme: "X" | "Y" | undefined;
  if ((core.endsWith("x") || core.endsWith("y")) && core.slice(0, -1).endsWith("ite")) {
    megaForme = core.endsWith("x") ? "X" : "Y";
    core = core.slice(0, -1);
  }
  if (!core.endsWith("ite")) {
    return undefined;
  }
  const ko = matchSpeciesKo(core.slice(0, -3));
  return ko ? { ko: `${ko}나이트${megaForme ? ` ${megaForme}` : ""}`, megaForme } : undefined;
};

const pokeapiKo = async (slug: string): Promise<string | undefined> => {
  try {
    const data = await fetchJson<{ names: Array<{ language: { name: string }; name: string }> }>(`/item/${slug}/`);
    return data.names.find((entry) => entry.language.name === "ko")?.name;
  } catch {
    return undefined;
  }
};

const main = async () => {
  mkdirSync(resolve(OUT, ".."), { recursive: true });

  const response = await fetch(
    `${SUPABASE}/season_allowed?allow_type=eq.item&select=allow_slug&limit=1000`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
  );
  if (!response.ok) {
    throw new Error(`season_allowed ${response.status} ${await response.text()}`);
  }
  const rows = (await response.json()) as Array<{ allow_slug: string }>;
  const slugs = [...new Set(rows.map((row) => row.allow_slug))].sort();

  const items: Item[] = [];
  for (const slug of slugs) {
    const mega = megaOf(slug);
    if (mega) {
      items.push({ slug, ko: mega.ko, isMega: true, megaForme: mega.megaForme });
      continue;
    }
    const ko = itemKoById.get(toId(slug)) ?? (await pokeapiKo(slug));
    items.push({ slug, ko: ko ?? slug, isMega: false });
  }

  const unresolved = items.filter((item) => item.ko === item.slug).map((item) => item.slug);
  const payload = {
    source: "pkmnchamps season_allowed + PokeAPI(보충)",
    generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
    count: items.length,
    items,
  };
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  process.stderr.write(`[done] ${OUT} (${items.length}개, 미해결 ${unresolved.length}: ${unresolved.join(", ")})\n`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
