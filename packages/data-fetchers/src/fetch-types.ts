import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { announce, concurrency, fetchJson, pickKo } from "./pokeapi";

type TypeResponse = {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
  damage_relations: {
    double_damage_from: Array<{ name: string }>;
    half_damage_from: Array<{ name: string }>;
    no_damage_from: Array<{ name: string }>;
  };
};

const TYPE_COUNT = 18;

const OUT = resolve(import.meta.dirname, "../../pokedex-core/data/types.json");

const main = async () => {
  const results = await Promise.all(
    Array.from({ length: TYPE_COUNT }, (_, i) => i + 1).map((i) =>
      concurrency(() => fetchJson<TypeResponse>(`/type/${i}/`))
    )
  );

  for (let i = 0; i < results.length; i++) announce("types", i + 1, TYPE_COUNT);

  const slugToKo: Record<string, string> = {};
  for (const t of results) {
    const ko = pickKo(t.names);
    if (!ko) throw new Error(`타입 한국어명 누락: ${t.name}`);
    slugToKo[t.name] = ko;
  }

  // PokeAPI의 damage_relations는 "방어 타입이 받는 배율" 기준이다.
  // 공격 → 방어 매트릭스로 뒤집어 계산한다.
  const matchup: Record<string, Record<string, number>> = {};
  for (const attacker of results) {
    const attackKo = slugToKo[attacker.name]!;
    const row: Record<string, number> = {};
    for (const defender of results) {
      const defenderKo = slugToKo[defender.name]!;
      const rel = defender.damage_relations;
      const takesZero = rel.no_damage_from.some((d) => d.name === attacker.name);
      const takesDouble = rel.double_damage_from.some((d) => d.name === attacker.name);
      const takesHalf = rel.half_damage_from.some((d) => d.name === attacker.name);
      row[defenderKo] = takesZero ? 0 : takesDouble ? 2 : takesHalf ? 0.5 : 1;
    }
    matchup[attackKo] = row;
  }

  const payload = {
    source: "PokeAPI v2",
    generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
    types_ko_to_en: Object.fromEntries(
      Object.entries(slugToKo).map(([en, ko]) => [ko, en])
    ),
    types_en_to_ko: slugToKo,
    matchup,
  };

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  process.stderr.write(`[done] ${OUT}\n`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
