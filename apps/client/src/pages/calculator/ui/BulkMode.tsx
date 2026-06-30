import { type NatureName, type TeraType, TYPE_NAMES, type TypeName } from '@pokedex-agent/pokedex-core';
import { useMemo, useState } from 'react';

import { Card } from '@/common/ui/Card';
import { Checkbox } from '@/common/ui/Checkbox';
import { Field } from '@/common/ui/Field';
import { NumberField } from '@/common/ui/NumberField';
import { Select } from '@/common/ui/Select';
import { PokemonIcon } from '@/features/pokemon-picker';
import { PokemonPicker } from '@/features/pokemon-picker';

import { type BulkInput, optimizeBulk } from '../lib/optimize';
import { type Category, DEFAULT_ATTACK, ITEM_OPTIONS, natureOptions, typeOptions } from './ev-options';
import { ResultRow } from './ResultRow';

type BulkState = typeof DEFAULT_ATTACK & {
  defenderSpecies: string;
  defenderLevel: number;
  defenderNature: NatureName;
  hits: number;
};

export const BulkMode = () => {
  const [state, setState] = useState<BulkState>({
    ...DEFAULT_ATTACK,
    defenderSpecies: '또가스',
    defenderLevel: 50,
    defenderNature: '신중',
    hits: 1,
  });
  const set = (patch: Partial<BulkState>) => setState((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => {
    const input: BulkInput = {
      defenderSpecies: state.defenderSpecies,
      defenderLevel: state.defenderLevel,
      defenderNature: state.defenderNature,
      attackerSpecies: state.attackerSpecies,
      attackerLevel: state.attackerLevel,
      attackerNature: state.attackerNature,
      attackerEv: state.attackerEv,
      attack: {
        level: state.attackerLevel,
        category: state.category,
        moveType: state.moveType,
        movePower: state.movePower,
        itemMultiplier: state.itemMultiplier,
        terastalized: state.terastalized,
        teraType: state.teraType,
      },
      hits: state.hits,
    };
    return optimizeBulk(input);
  }, [state]);

  const spreadText = (spread: {
    hpEv: number;
    defEv: number;
    total: number;
    hp: number;
    defense: number;
    takenPercent: number;
  }) =>
    `HP ${spread.hpEv} / ${state.category === '물리' ? '방어' : '특방'} ${spread.defEv} (합 ${spread.total}) → HP ${spread.hp}·${state.category === '물리' ? '방어' : '특방'} ${spread.defense}, 최대 ${spread.takenPercent.toFixed(1)}% 받음`;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="flex flex-col gap-3">
        <h2 className="text-info text-sm font-semibold">버틸 포켓몬(나)</h2>
        <Field label="포켓몬">
          <div className="flex items-center gap-2">
            <PokemonIcon species={state.defenderSpecies} />
            <PokemonPicker value={state.defenderSpecies} onSelect={(name) => set({ defenderSpecies: name })} />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="레벨">
            <NumberField
              value={state.defenderLevel}
              min={1}
              max={100}
              onValueChange={(value) => set({ defenderLevel: value })}
            />
          </Field>
          <Field label="성격">
            <Select
              value={state.defenderNature}
              onValueChange={(value) => set({ defenderNature: value as NatureName })}
              options={natureOptions}
            />
          </Field>
          <Field label="버틸 횟수">
            <NumberField value={state.hits} min={1} max={4} onValueChange={(value) => set({ hits: value })} />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-primary text-sm font-semibold">막을 공격(상대)</h2>
        <Field label="포켓몬">
          <div className="flex items-center gap-2">
            <PokemonIcon species={state.attackerSpecies} />
            <PokemonPicker value={state.attackerSpecies} onSelect={(name) => set({ attackerSpecies: name })} />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="분류">
            <Select
              value={state.category}
              onValueChange={(value) => set({ category: value as Category })}
              options={[
                { value: '물리', label: '물리' },
                { value: '특수', label: '특수' },
              ]}
            />
          </Field>
          <Field label="기술 타입">
            <Select
              value={state.moveType}
              onValueChange={(value) => set({ moveType: value as TypeName })}
              options={typeOptions}
            />
          </Field>
          <Field label="위력">
            <NumberField
              value={state.movePower}
              min={0}
              max={250}
              onValueChange={(value) => set({ movePower: value })}
            />
          </Field>
          <Field label="공격 노력치">
            <NumberField
              value={state.attackerEv}
              min={0}
              max={32}
              onValueChange={(value) => set({ attackerEv: value })}
            />
          </Field>
          <Field label="성격">
            <Select
              value={state.attackerNature}
              onValueChange={(value) => set({ attackerNature: value as NatureName })}
              options={natureOptions}
            />
          </Field>
          <Field label="도구">
            <Select
              value={String(state.itemMultiplier)}
              onValueChange={(value) => set({ itemMultiplier: Number(value) })}
              options={ITEM_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))}
            />
          </Field>
        </div>
        <Checkbox
          checked={state.terastalized}
          onCheckedChange={(checked) => set({ terastalized: checked })}
          label="테라스탈"
        />
        {state.terastalized && (
          <Select
            value={state.teraType}
            onValueChange={(value) => set({ teraType: value as TeraType })}
            options={[...TYPE_NAMES, '스텔라'].map((type) => ({ value: type, label: type }))}
          />
        )}
      </Card>

      <Card className="md:col-span-2">
        {!result ? (
          <p className="text-muted-foreground text-sm">포켓몬을 정확히 입력하라.</p>
        ) : !result.canSurvive ? (
          <p className="text-destructive text-sm font-medium">최대 투자(HP·방어 32/32)로도 버티지 못한다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <h3 className="text-foreground text-sm font-semibold">확정으로 버티는 최소 노력치</h3>
            {result.best && <ResultRow label="최소 합" value={spreadText(result.best)} strong />}
            {result.hpHeavy && result.hpHeavy.total !== result.best?.total && (
              <ResultRow label="HP 우선" value={spreadText(result.hpHeavy)} />
            )}
            {result.defHeavy && result.defHeavy.total !== result.best?.total && (
              <ResultRow label="방어 우선" value={spreadText(result.defHeavy)} />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
