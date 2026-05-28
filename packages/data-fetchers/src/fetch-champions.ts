import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

try {
  process.loadEnvFile();
} catch {
  // .env 없으면 무시
}

// 출처: pkmnchamps.com (포켓몬 챔피언스 배틀 도구). Supabase 공개 anon 키로 읽기 전용 조회.
// 게임 데이터 테이블만 사용하며 유저 PII 테이블(user_profiles 등)은 건드리지 않는다.
const SUPABASE = "https://misabaliuftjkqigysvv.supabase.co/rest/v1";
const ANON_KEY = process.env.PKMNCHAMPS_ANON_KEY;
if (!ANON_KEY) {
  throw new Error("PKMNCHAMPS_ANON_KEY 환경변수 필요 — pkmnchamps.com 개발자도구 Network 탭에서 supabase anon 키 확인");
}
const SOURCE = "pkmnchamps.com (Supabase 공개 anon, 읽기 전용)";
const OUT_DIR = resolve(import.meta.dirname, "../../pokedex-core/data/champions");

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, Accept: "application/json" };

const query = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${SUPABASE}/${path}`, { headers });
  if (!response.ok) {
    throw new Error(`${path} -> ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
};

// PostgREST 기본 1000행 한계 → offset 페이지네이션.
const queryAll = async <T>(path: string): Promise<T[]> => {
  const page = 1000;
  const rows: T[] = [];
  for (let offset = 0; ; offset += page) {
    const sep = path.includes("?") ? "&" : "?";
    const batch = await query<T[]>(`${path}${sep}limit=${page}&offset=${offset}`);
    rows.push(...batch);
    if (batch.length < page) {
      break;
    }
  }
  return rows;
};

type Season = { id: string; slug: string; name_ko: string; is_active: boolean };
type RosterRow = { pokemon_id: number; mega_form: string; region_form: string };
type StatRow = {
  pokemon_id: number;
  pokemon_name_ko: string;
  mega_form: string;
  region_form: string;
  pick_rank: number | null;
  abilities: unknown;
  moves: unknown;
  items: unknown;
  natures: unknown;
  spreads: unknown;
  teammates: unknown;
};
type SampleRow = {
  pokemon_id: number;
  pokemon_name_ko: string;
  pokemon_name_en: string;
  nature: string | null;
  ability: string | null;
  mega_form: string | null;
  item: string | null;
  level: number | null;
  sps: unknown;
  move_slots: unknown;
};

const stamp = () => process.env.GENERATED_AT_UTC ?? new Date().toISOString();
const write = (name: string, payload: unknown) => {
  writeFileSync(resolve(OUT_DIR, name), JSON.stringify(payload, null, 2) + "\n", "utf8");
  process.stderr.write(`[done] ${name}\n`);
};

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  const seasons = await query<Season[]>("seasons?select=id,slug,name_ko,is_active&order=sort_order.desc");
  const active = seasons.find((season) => season.is_active) ?? seasons[0];
  if (!active) {
    throw new Error("활성 시즌을 찾지 못했습니다");
  }
  process.stderr.write(`활성 레귤레이션: ${active.slug} (${active.name_ko})\n`);

  // 로스터
  const rosterRows = await queryAll<RosterRow>(
    `season_pokemon?season_id=eq.${active.id}&select=pokemon_id,mega_form,region_form&order=pokemon_id.asc`
  );
  const roster = rosterRows
    .map((row) => ({ id: row.pokemon_id, megaForm: row.mega_form || "", regionForm: row.region_form || "" }))
    .sort((a, b) => a.id - b.id || a.megaForm.localeCompare(b.megaForm));
  write("roster.json", {
    source: SOURCE,
    season: active.slug,
    generated_at_utc: stamp(),
    count: roster.length,
    pokemon: roster,
  });

  // 싱글 사용률
  const statRows = await queryAll<StatRow>(
    `champions_pokemon_stats?regulation=eq.${active.slug}&battle_format=eq.singles` +
      `&select=pokemon_id,pokemon_name_ko,mega_form,region_form,pick_rank,abilities,moves,items,natures,spreads,teammates` +
      `&order=pokemon_id.asc`
  );
  const usage: Record<string, unknown[]> = {};
  for (const row of statRows) {
    (usage[row.pokemon_id] ??= []).push({
      nameKo: row.pokemon_name_ko,
      megaForm: row.mega_form || "",
      regionForm: row.region_form || "",
      pickRank: row.pick_rank,
      abilities: row.abilities,
      moves: row.moves,
      items: row.items,
      natures: row.natures,
      spreads: row.spreads,
      teammates: row.teammates,
    });
  }
  write("usage-singles.json", {
    source: SOURCE,
    regulation: active.slug,
    format: "singles",
    generated_at_utc: stamp(),
    count: Object.keys(usage).length,
    pokemon: Object.fromEntries(Object.entries(usage).sort(([a], [b]) => Number(a) - Number(b))),
  });

  // 샘플 세트 (공개)
  const sampleRows = await queryAll<SampleRow>(
    `pokemon_samples?is_public=eq.true` +
      `&select=pokemon_id,pokemon_name_ko,pokemon_name_en,nature,ability,mega_form,item,level,sps,move_slots` +
      `&order=id.asc`
  );
  const samples: Record<string, unknown[]> = {};
  for (const row of sampleRows) {
    (samples[row.pokemon_id] ??= []).push({
      nameKo: row.pokemon_name_ko,
      nameEn: row.pokemon_name_en,
      nature: row.nature,
      ability: row.ability,
      megaForm: row.mega_form || "",
      item: row.item,
      level: row.level,
      evs: row.sps,
      moves: row.move_slots,
    });
  }
  write("samples-singles.json", {
    source: SOURCE,
    generated_at_utc: stamp(),
    count: sampleRows.length,
    byPokemon: Object.fromEntries(Object.entries(samples).sort(([a], [b]) => Number(a) - Number(b))),
  });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
