import { findPokemon, TYPE_NAMES } from "@pokedex-agent/pokedex-core";

import { cn } from "@/common/lib/cn";
import { Button } from "@/common/ui/Button";
import { Card } from "@/common/ui/Card";
import { Field } from "@/common/ui/Field";
import { Input } from "@/common/ui/Input";
import { Select } from "@/common/ui/Select";
import { PokemonIcon } from "@/features/pokemon-picker/ui/PokemonIcon";

import {
  ALL_GENERATIONS,
  ALL_TYPES,
  baseStatTotal,
  filterDex,
  weaknessTable,
} from "../lib/search";
import { useDexStore } from "../model/store";

const PAGE_SIZE = 20;
const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const multiplierClass = (multiplier: number): string => {
  if (multiplier === 0) return "bg-sky-900 text-sky-300";
  if (multiplier >= 4) return "bg-rose-700 text-rose-100";
  if (multiplier === 2) return "bg-rose-900 text-rose-300";
  if (multiplier < 1) return "bg-emerald-900 text-emerald-300";
  return "bg-neutral-800 text-neutral-400";
};

const TypeBadges = ({ types }: { types: ReadonlyArray<string> }) => (
  <span className="flex gap-1">
    {types.map((type) => (
      <span key={type} className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-200">
        {type}
      </span>
    ))}
  </span>
);

export const DexPage = () => {
  const { query, type, generation, page, selectedNo, setQuery, setType, setGeneration, setPage, select } =
    useDexStore();

  const results = filterDex({ query, type, generation });
  const selected = selectedNo === null ? undefined : findPokemon(selectedNo);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageEntries = results.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">도감</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="검색">
          <Input value={query} placeholder="이름 또는 도감번호" onChange={(event) => setQuery(event.currentTarget.value)} />
        </Field>
        <Field label="타입">
          <Select value={type} onChange={(event) => setType(event.currentTarget.value as typeof type)}>
            <option value={ALL_TYPES}>전체</option>
            {TYPE_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="세대">
          <Select value={generation} onChange={(event) => setGeneration(Number(event.currentTarget.value))}>
            <option value={ALL_GENERATIONS}>전체</option>
            {GENERATIONS.map((gen) => (
              <option key={gen} value={gen}>
                {gen}세대
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {selected && (
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <PokemonIcon species={selected.ko} className="h-14 w-14" />
            <span className="text-lg font-bold">
              #{selected.no} {selected.ko}
            </span>
            <TypeBadges types={selected.types} />
            <span className="text-sm text-neutral-400">
              종족값 합 {baseStatTotal(selected)} · {selected.generation}세대
            </span>
          </div>
          <div>
            <h3 className="mb-1.5 text-xs font-medium text-neutral-400">받는 상성 (방어 기준)</h3>
            <div className="grid grid-cols-6 gap-1">
              {weaknessTable(selected.types).map((entry) => (
                <div
                  key={entry.type}
                  className={cn(
                    "flex flex-col items-center rounded px-1 py-1 text-xs",
                    multiplierClass(entry.multiplier)
                  )}
                >
                  <span>{entry.type}</span>
                  <span className="font-semibold">{entry.multiplier}배</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <p className="text-xs text-neutral-500">
        {results.length === 0
          ? "결과 없음"
          : `${results.length}마리 중 ${startIndex + 1}~${Math.min(results.length, startIndex + PAGE_SIZE)} 표시 (페이지 ${safePage}/${totalPages})`}
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {pageEntries.map((entry) => (
          <button
            key={entry.no}
            type="button"
            onClick={() => select(entry.no)}
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition",
              entry.no === selectedNo
                ? "border-emerald-500 bg-neutral-900"
                : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
            )}
          >
            <span className="flex items-center gap-1.5">
              <PokemonIcon species={entry.ko} className="h-9 w-9" />
              <span className="text-xs text-neutral-500">#{entry.no}</span>
              <span className="text-sm font-medium">{entry.ko}</span>
            </span>
            <TypeBadges types={entry.types} />
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <Button variant="secondary" disabled={safePage === 1} onClick={() => setPage(1)}>
            처음
          </Button>
          <Button variant="secondary" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>
            이전
          </Button>
          <span className="text-neutral-400">
            {safePage} / {totalPages}
          </span>
          <Button variant="secondary" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>
            다음
          </Button>
          <Button variant="secondary" disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>
            끝
          </Button>
        </div>
      )}
    </section>
  );
};
