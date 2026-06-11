import { NATURE_NAMES, TYPE_NAMES } from '@pokedex-agent/pokedex-core';

import { cn } from '@/common/lib/cn';
import { Card } from '@/common/ui/Card';
import { Checkbox } from '@/common/ui/Checkbox';
import { Field } from '@/common/ui/Field';
import { NumberField } from '@/common/ui/NumberField';
import { Select } from '@/common/ui/Select';
import { PokemonDatalist } from '@/features/pokemon-picker/ui/PokemonDatalist';
import { PokemonIcon } from '@/features/pokemon-picker/ui/PokemonIcon';
import { PokemonPicker } from '@/features/pokemon-picker/ui/PokemonPicker';

import { computeCalc } from '../lib/calc';
import { useCalculatorStore } from '../model/store';

const ITEM_OPTIONS = [
  { value: 1, label: '없음' },
  { value: 1.2, label: '안경/구애머리띠 등 1.2배' },
  { value: 1.3, label: '생명의구슬 1.3배' },
  { value: 1.5, label: '구애 1.5배' },
] as const;

const WEATHER_OPTIONS = [
  { value: 1, label: '없음' },
  { value: 1.5, label: '강화 1.5배' },
  { value: 0.5, label: '약화 0.5배' },
] as const;

const RollBar = ({ rolls, max }: { rolls: number[]; max: number }) => (
  <div className="flex h-20 items-end gap-0.5">
    {rolls.map((roll, index) => (
      <div
        key={index}
        className="flex-1 rounded-t bg-emerald-500/80"
        style={{ height: `${max > 0 ? (roll / max) * 100 : 0}%` }}
        title={String(roll)}
      />
    ))}
  </div>
);

export const DamageTab = () => {
  const { attacker, defender, setAttacker, setDefender } = useCalculatorStore();
  const result = computeCalc(attacker, defender);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <h2 className="text-primary text-sm font-semibold">공격</h2>
          <Field label="포켓몬">
            <div className="flex items-center gap-2">
              <PokemonIcon species={attacker.species} />
              <PokemonPicker
                value={attacker.species}
                invalid={!result}
                onSelect={(name) => setAttacker({ species: name })}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="분류">
              <Select
                value={attacker.category}
                onValueChange={(value) => setAttacker({ category: value as '물리' | '특수' })}
                options={[
                  { value: '물리', label: '물리' },
                  { value: '특수', label: '특수' },
                ]}
              />
            </Field>
            <Field label="기술 타입">
              <Select
                value={attacker.moveType}
                onValueChange={(value) => setAttacker({ moveType: value as (typeof TYPE_NAMES)[number] })}
                options={TYPE_NAMES.map((type) => ({ value: type, label: type }))}
              />
            </Field>
            <Field label="위력">
              <NumberField
                value={attacker.movePower}
                min={0}
                max={250}
                onValueChange={(value) => setAttacker({ movePower: value })}
              />
            </Field>
            <Field label="공격 노력치">
              <NumberField
                value={attacker.ev}
                min={0}
                max={32}
                step={1}
                onValueChange={(value) => setAttacker({ ev: value })}
              />
            </Field>
            <Field label="성격">
              <Select
                value={attacker.nature}
                onValueChange={(value) => setAttacker({ nature: value as (typeof NATURE_NAMES)[number] })}
                options={NATURE_NAMES.map((nature) => ({ value: nature, label: nature }))}
              />
            </Field>
            <Field label="공격 랭크">
              <NumberField
                value={attacker.rank}
                min={-6}
                max={6}
                onValueChange={(value) => setAttacker({ rank: value })}
              />
            </Field>
            <Field label="도구">
              <Select
                value={String(attacker.itemMultiplier)}
                onValueChange={(value) => setAttacker({ itemMultiplier: Number(value) })}
                options={ITEM_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))}
              />
            </Field>
            <Field label="날씨">
              <Select
                value={String(attacker.weatherBoost)}
                onValueChange={(value) => setAttacker({ weatherBoost: Number(value) as 1 | 1.5 | 0.5 })}
                options={WEATHER_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))}
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Checkbox
              checked={attacker.terastalized}
              onCheckedChange={(checked) => setAttacker({ terastalized: checked })}
              label="테라스탈"
            />
            {attacker.terastalized && (
              <Select
                className="w-auto"
                value={attacker.teraType}
                onValueChange={(value) => setAttacker({ teraType: value as typeof attacker.teraType })}
                options={[...TYPE_NAMES, '스텔라'].map((type) => ({ value: type, label: type }))}
              />
            )}
            <Checkbox
              checked={attacker.critical}
              onCheckedChange={(checked) => setAttacker({ critical: checked })}
              label="급소"
            />
            <Checkbox
              checked={attacker.burned}
              onCheckedChange={(checked) => setAttacker({ burned: checked })}
              label="화상"
            />
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-info text-sm font-semibold">방어</h2>
          <Field label="포켓몬">
            <div className="flex items-center gap-2">
              <PokemonIcon species={defender.species} />
              <PokemonPicker
                value={defender.species}
                invalid={!result}
                onSelect={(name) => setDefender({ species: name })}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="HP 노력치">
              <NumberField
                value={defender.hpEv}
                min={0}
                max={32}
                step={1}
                onValueChange={(value) => setDefender({ hpEv: value })}
              />
            </Field>
            <Field label="방어 노력치">
              <NumberField
                value={defender.defEv}
                min={0}
                max={32}
                step={1}
                onValueChange={(value) => setDefender({ defEv: value })}
              />
            </Field>
            <Field label="성격">
              <Select
                value={defender.nature}
                onValueChange={(value) => setDefender({ nature: value as (typeof NATURE_NAMES)[number] })}
                options={NATURE_NAMES.map((nature) => ({ value: nature, label: nature }))}
              />
            </Field>
            <Field label="방어 랭크">
              <NumberField
                value={defender.rank}
                min={-6}
                max={6}
                onValueChange={(value) => setDefender({ rank: value })}
              />
            </Field>
          </div>
        </Card>
      </div>

      <Card>
        {result ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="text-primary text-2xl font-bold">
                {result.minPercent.toFixed(1)}% ~ {result.maxPercent.toFixed(1)}%
              </span>
              <span className="text-muted-foreground text-sm">
                데미지 {result.damage.min} ~ {result.damage.max} / HP {result.defenderHp}
              </span>
              <span className="text-muted-foreground text-sm">상성 {result.damage.effectiveness}배</span>
              <span
                className={cn('text-sm font-medium', result.maxPercent >= 100 ? 'text-destructive' : 'text-foreground')}
              >
                {result.hitsText || '데미지 없음'}
              </span>
            </div>
            <RollBar rolls={result.damage.rolls} max={result.damage.max} />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">공격·방어 포켓몬을 정확히 입력하라.</p>
        )}
      </Card>

      <PokemonDatalist />
    </>
  );
};
