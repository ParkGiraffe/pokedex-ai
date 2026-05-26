import { NATURE_NAMES } from "@pokedex-agent/pokedex-core";

import { cn } from "@/common/lib/cn";
import { Card } from "@/common/ui/Card";
import { Field } from "@/common/ui/Field";
import { NumberField } from "@/common/ui/NumberField";
import { Select } from "@/common/ui/Select";
import { PokemonDatalist } from "@/features/pokemon-picker/ui/PokemonDatalist";
import { PokemonIcon } from "@/features/pokemon-picker/ui/PokemonIcon";
import { PokemonPicker } from "@/features/pokemon-picker/ui/PokemonPicker";

import { compareSpeed, computeSpeed } from "../lib/calc";
import { type SpeedSide, useSpeedStore } from "../model/store";

type SideCardProps = {
  title: string;
  accent: string;
  side: SpeedSide;
  onChange: (patch: Partial<SpeedSide>) => void;
};

const SideCard = ({ title, accent, side, onChange }: SideCardProps) => {
  const speed = computeSpeed(side);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className={cn("text-sm font-semibold", accent)}>{title}</h2>
        <span className="text-lg font-bold">{speed ?? "-"}</span>
      </div>
      <Field label="종족">
        <div className="flex items-center gap-2">
          <PokemonIcon species={side.species} />
          <PokemonPicker value={side.species} invalid={speed === undefined} onSelect={(name) => onChange({ species: name })} />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="스피드 노력치">
          <NumberField value={side.ev} min={0} max={252} step={4} onValueChange={(value) => onChange({ ev: value })} />
        </Field>
        <Field label="성격">
          <Select
            value={side.nature}
            onChange={(event) => onChange({ nature: event.currentTarget.value as (typeof NATURE_NAMES)[number] })}
          >
            {NATURE_NAMES.map((nature) => (
              <option key={nature} value={nature}>
                {nature}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="스피드 랭크">
          <NumberField value={side.rank} min={-6} max={6} onValueChange={(value) => onChange({ rank: value })} />
        </Field>
        <Field label="도구/특성 배율">
          <Select
            value={side.itemMultiplier}
            onChange={(event) => onChange({ itemMultiplier: Number(event.currentTarget.value) })}
          >
            <option value={1}>없음</option>
            <option value={1.5}>구애스카프 1.5배</option>
            <option value={0.5}>두꺼운자루 0.5배</option>
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={side.tailwind} onChange={(event) => onChange({ tailwind: event.currentTarget.checked })} />
          순풍
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={side.paralyzed} onChange={(event) => onChange({ paralyzed: event.currentTarget.checked })} />
          마비
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={side.stickyWeb} onChange={(event) => onChange({ stickyWeb: event.currentTarget.checked })} />
          끈적네트
        </label>
      </div>
    </Card>
  );
};

export const SpeedPage = () => {
  const { left, right, trickRoom, setLeft, setRight, setTrickRoom } = useSpeedStore();
  const comparison = compareSpeed(left, right, trickRoom);

  const fasterLabel =
    comparison === undefined
      ? "-"
      : comparison.faster === "tie"
        ? "동률 (50%)"
        : `${comparison.faster === "left" ? left.species : right.species} 선공`;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">스피드</h1>
      </header>

      <label className="flex w-fit items-center gap-1.5 text-sm">
        <input type="checkbox" checked={trickRoom} onChange={(event) => setTrickRoom(event.currentTarget.checked)} />
        트릭룸
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <SideCard title="좌" accent="text-emerald-400" side={left} onChange={setLeft} />
        <SideCard title="우" accent="text-sky-400" side={right} onChange={setRight} />
      </div>

      <Card>
        <p className="text-lg font-bold text-emerald-400">{fasterLabel}</p>
        {comparison && (
          <p className="mt-1 text-sm text-neutral-400">
            좌 {comparison.left} vs 우 {comparison.right}
            {trickRoom ? " (트릭룸: 느린 쪽이 선공)" : ""}
          </p>
        )}
      </Card>

      <PokemonDatalist />
    </section>
  );
};
