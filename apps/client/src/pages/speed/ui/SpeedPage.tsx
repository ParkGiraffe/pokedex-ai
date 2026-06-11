import { findMegasBySpecies, findPokemon, NATURE_NAMES, speciesDisplayName } from '@pokedex-agent/pokedex-core';
import { Gauge } from 'lucide-react';

import { cn } from '@/common/lib/cn';
import { Badge } from '@/common/ui/Badge';
import { Card } from '@/common/ui/Card';
import { Checkbox } from '@/common/ui/Checkbox';
import { Field } from '@/common/ui/Field';
import { NumberField } from '@/common/ui/NumberField';
import { Select } from '@/common/ui/Select';
import { TypeBadge } from '@/common/ui/TypeBadge';
import { MegaControl } from '@/features/pokemon-picker/ui/MegaControl';
import { PokemonDatalist } from '@/features/pokemon-picker/ui/PokemonDatalist';
import { PokemonIcon } from '@/features/pokemon-picker/ui/PokemonIcon';
import { PokemonPicker } from '@/features/pokemon-picker/ui/PokemonPicker';

import { compareSpeed, computeSpeed } from '../lib/calc';
import { type SpeedSide, useSpeedStore } from '../model/store';

type Accent = 'left' | 'right';

const ACCENT_TEXT: Record<Accent, string> = { left: 'text-primary', right: 'text-info' };

const TypeRow = ({ types }: { types: readonly string[] }) => {
  if (types.length === 0) {
    return null;
  }
  return (
    <span className="flex flex-wrap justify-center gap-1">
      {types.map((type) => (
        <TypeBadge key={type} type={type} />
      ))}
    </span>
  );
};

// 상단 VS 요약 — 양쪽 스프라이트·타입·실효 스피드와 선공 판정을 한눈에.
type VersusProps = {
  left: SpeedSide;
  right: SpeedSide;
  trickRoom: boolean;
};

const VersusPanel = ({ left, right, trickRoom }: VersusProps) => {
  const comparison = compareSpeed(left, right, trickRoom);

  if (!comparison) {
    return <Card className="text-muted-foreground text-center text-sm">양쪽 포켓몬을 입력하면 선공을 판정한다.</Card>;
  }

  const total = comparison.left + comparison.right || 1;
  const leftPercent = Math.round((comparison.left / total) * 100);
  const gap = Math.abs(comparison.left - comparison.right);

  const column = (accent: Accent, side: SpeedSide, value: number, winner: boolean) => {
    // 메가 선택 시 메가 표시명(메가리자몽X 등)과 메가 타입을 보여준다.
    const mega = side.megaForm
      ? findMegasBySpecies(side.species).find((form) => form.form === side.megaForm)
      : undefined;
    const types = mega?.types ?? findPokemon(side.species)?.types ?? [];
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition',
          winner ? 'border-primary/50 bg-primary/5' : 'border-border bg-card',
        )}
      >
        <PokemonIcon species={side.species} className="h-16 w-16" />
        <span className="text-foreground text-sm font-semibold">
          {side.species ? speciesDisplayName(side.species, side.megaForm) : '—'}
        </span>
        <TypeRow types={types} />
        <span className={cn('text-3xl font-extrabold tabular-nums', ACCENT_TEXT[accent])}>{value}</span>
        {winner ? (
          <Badge variant="success" size="sm">
            선공
          </Badge>
        ) : (
          <span className="h-[22px]" />
        )}
      </div>
    );
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {column('left', left, comparison.left, comparison.faster === 'left')}
        <div className="flex flex-col items-center gap-1">
          <span className="text-muted-foreground text-xs font-bold tracking-[0.3em]">VS</span>
          {comparison.faster === 'tie' ? (
            <Badge variant="muted">동률</Badge>
          ) : (
            <span className="text-muted-foreground text-xs">+{gap}</span>
          )}
          {trickRoom && (
            <Badge variant="warning" size="sm">
              트릭룸
            </Badge>
          )}
        </div>
        {column('right', right, comparison.right, comparison.faster === 'right')}
      </div>

      <div className="bg-muted flex h-2 overflow-hidden rounded-full" aria-hidden>
        <div className="bg-primary transition-all" style={{ width: `${leftPercent}%` }} />
        <div className="bg-info flex-1 transition-all" />
      </div>

      <p className="text-center text-sm">
        {comparison.faster === 'tie' ? (
          <span className="text-muted-foreground font-semibold">동률 — 50% 선공</span>
        ) : (
          <>
            <span className="text-foreground font-bold">
              {comparison.faster === 'left'
                ? speciesDisplayName(left.species, left.megaForm)
                : speciesDisplayName(right.species, right.megaForm)}
            </span>
            <span className="text-muted-foreground"> 선공</span>
          </>
        )}
        {trickRoom && <span className="text-muted-foreground"> · 트릭룸(느린 쪽 선공)</span>}
      </p>
    </Card>
  );
};

type SideCardProps = {
  title: string;
  accent: Accent;
  side: SpeedSide;
  winning: boolean;
  onChange: (patch: Partial<SpeedSide>) => void;
};

const SideCard = ({ title, accent, side, winning, onChange }: SideCardProps) => {
  const speed = computeSpeed(side);
  return (
    <Card className={cn('flex flex-col gap-3 transition', winning && 'ring-primary/40 ring-1')}>
      <div className="flex items-center gap-2">
        <span className={cn('size-2 rounded-full', accent === 'left' ? 'bg-primary' : 'bg-info')} />
        <h2 className={cn('text-sm font-semibold', ACCENT_TEXT[accent])}>{title}</h2>
        {winning && (
          <Badge variant="success" size="sm">
            선공
          </Badge>
        )}
        <span className="ml-auto text-2xl font-bold tabular-nums">{speed ?? '-'}</span>
      </div>

      <Field label="포켓몬">
        <div className="flex items-center gap-2">
          <PokemonIcon species={side.species} className="h-10 w-10" />
          <PokemonPicker
            value={side.species}
            invalid={speed === undefined}
            onSelect={(name) => onChange({ species: name })}
          />
        </div>
      </Field>

      {findMegasBySpecies(side.species).length > 0 && (
        <Field label="메가진화">
          <MegaControl species={side.species} value={side.megaForm} onChange={(form) => onChange({ megaForm: form })} />
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
              { value: '1', label: '없음' },
              { value: '1.5', label: '구애스카프 1.5배' },
              { value: '0.5', label: '두꺼운자루 0.5배' },
            ]}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Checkbox checked={side.tailwind} onCheckedChange={(checked) => onChange({ tailwind: checked })} label="순풍" />
        <Checkbox
          checked={side.paralyzed}
          onCheckedChange={(checked) => onChange({ paralyzed: checked })}
          label="마비"
        />
        <Checkbox
          checked={side.stickyWeb}
          onCheckedChange={(checked) => onChange({ stickyWeb: checked })}
          label="끈적네트"
        />
      </div>
    </Card>
  );
};

export const SpeedPage = () => {
  const { left, right, trickRoom, setLeft, setRight, setTrickRoom } = useSpeedStore();
  const comparison = compareSpeed(left, right, trickRoom);

  return (
    <section className="flex flex-col gap-5">
      <header className="border-border flex flex-wrap items-center gap-3 border-b pb-3">
        <Gauge className="text-primary size-6" />
        <h1 className="text-2xl font-bold tracking-tight">스피드</h1>
        <div className="ml-auto">
          <Checkbox checked={trickRoom} onCheckedChange={setTrickRoom} label="트릭룸" />
        </div>
      </header>

      <VersusPanel left={left} right={right} trickRoom={trickRoom} />

      <div className="grid gap-4 md:grid-cols-2">
        <SideCard title="좌" accent="left" side={left} winning={comparison?.faster === 'left'} onChange={setLeft} />
        <SideCard title="우" accent="right" side={right} winning={comparison?.faster === 'right'} onChange={setRight} />
      </div>

      <PokemonDatalist />
    </section>
  );
};
