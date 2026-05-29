import { findMegasBySpecies, NATURE_NAMES } from "@pokedex-agent/pokedex-core";

import { cn } from "@/common/lib/cn";
import { Card } from "@/common/ui/Card";
import { Checkbox } from "@/common/ui/Checkbox";
import { Field } from "@/common/ui/Field";
import { NumberField } from "@/common/ui/NumberField";
import { Select } from "@/common/ui/Select";
import { MegaControl } from "@/features/pokemon-picker/ui/MegaControl";
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
      <Field label="포켓몬">
        <div className="flex items-center gap-2">
          <PokemonIcon species={side.species} />
          <PokemonPicker value={side.species} invalid={speed === undefined} onSelect={(name) => onChange({ species: name })} />
        </div>
      </Field>
      {findMegasBySpecies(side.species).length > 0 && (
        <Field label="메가진화">
          <MegaControl
            species={side.species}
            value={side.megaForm}
            onChange={(form) => onChange({ megaForm: form })}
          />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="스피드 노력치">
          <NumberField value={side.ev} min={0} max={32} step={1} onValueChange={(value) => onChange({ ev: value })} />
        </Field>
        <Field label="성격">
          <Select
            value={side.nature}
            onValueChange={(value) => onChange({ nature: value as (typeof NATURE_NAMES)[number] })}
            options={NATURE_NAMES.map((nature) => ({ value: nature, label: nature }))}
          />
        </Field>
        <Field label="스피드 랭크">
          <NumberField value={side.rank} min={-6} max={6} onValueChange={(value) => onChange({ rank: value })} />
        </Field>
        <Field label="도구/특성 배율">
          <Select
            value={String(side.itemMultiplier)}
            onValueChange={(value) => onChange({ itemMultiplier: Number(value) })}
            options={[
              { value: "1", label: "없음" },
              { value: "1.5", label: "구애스카프 1.5배" },
              { value: "0.5", label: "두꺼운자루 0.5배" },
            ]}
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <Checkbox checked={side.tailwind} onCheckedChange={(checked) => onChange({ tailwind: checked })} label="순풍" />
        <Checkbox checked={side.paralyzed} onCheckedChange={(checked) => onChange({ paralyzed: checked })} label="마비" />
        <Checkbox checked={side.stickyWeb} onCheckedChange={(checked) => onChange({ stickyWeb: checked })} label="끈적네트" />
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

      <Checkbox checked={trickRoom} onCheckedChange={setTrickRoom} label="트릭룸" className="w-fit" />

      <div className="grid gap-4 md:grid-cols-2">
        <SideCard title="좌" accent="text-primary" side={left} onChange={setLeft} />
        <SideCard title="우" accent="text-info" side={right} onChange={setRight} />
      </div>

      <Card>
        <p className="text-lg font-bold text-primary">{fasterLabel}</p>
        {comparison && (
          <p className="mt-1 text-sm text-muted-foreground">
            좌 {comparison.left} vs 우 {comparison.right}
            {trickRoom ? " (트릭룸: 느린 쪽이 선공)" : ""}
          </p>
        )}
      </Card>

      <PokemonDatalist />
    </section>
  );
};
