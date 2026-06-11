import { type NatureName } from '@pokedex-agent/pokedex-core';
import { useMemo, useState } from 'react';

import { Card } from '@/common/ui/Card';
import { Field } from '@/common/ui/Field';
import { NumberField } from '@/common/ui/NumberField';
import { Select } from '@/common/ui/Select';
import { PokemonIcon } from '@/features/pokemon-picker/ui/PokemonIcon';
import { PokemonPicker } from '@/features/pokemon-picker/ui/PokemonPicker';

import { assumedSpeed, optimizeSpeed, type SpeedReverseInput } from '../lib/optimize';
import { natureOptions } from './ev-options';
import { ResultRow } from './ResultRow';

const SPEED_ITEM_OPTIONS = [
  { value: 1, label: '없음' },
  { value: 1.5, label: '구애스카프 1.5배' },
  { value: 0.5, label: '둔한머리 0.5배' },
] as const;

const ABILITY_OPTIONS = [
  { value: 1, label: '없음' },
  { value: 1.5, label: '가속/엽록소 등 1.5배' },
  { value: 2, label: '모래헤치기 등 2배' },
] as const;

export const EvSpeedMode = () => {
  const [state, setState] = useState({
    species: '한카리아스',
    level: 50,
    nature: '겁쟁이' as NatureName,
    itemMultiplier: 1,
    abilityMultiplier: 1,
    targetSpeed: 130,
  });
  const set = (patch: Partial<typeof state>) => setState((prev) => ({ ...prev, ...patch }));
  const [targetSpecies, setTargetSpecies] = useState('마기라스');

  const result = useMemo(() => {
    const input: SpeedReverseInput = { ...state };
    return optimizeSpeed(input);
  }, [state]);

  const fillFromSpecies = () => {
    const speed = assumedSpeed(targetSpecies, state.level, '겁쟁이');
    if (speed !== undefined) {
      set({ targetSpeed: speed });
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="flex flex-col gap-3">
        <h2 className="text-info text-sm font-semibold">내 포켓몬</h2>
        <Field label="포켓몬">
          <div className="flex items-center gap-2">
            <PokemonIcon species={state.species} />
            <PokemonPicker value={state.species} onSelect={(name) => set({ species: name })} />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="레벨">
            <NumberField value={state.level} min={1} max={100} onValueChange={(value) => set({ level: value })} />
          </Field>
          <Field label="성격">
            <Select
              value={state.nature}
              onValueChange={(value) => set({ nature: value as NatureName })}
              options={natureOptions}
            />
          </Field>
          <Field label="도구">
            <Select
              value={String(state.itemMultiplier)}
              onValueChange={(value) => set({ itemMultiplier: Number(value) })}
              options={SPEED_ITEM_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))}
            />
          </Field>
          <Field label="특성/가속">
            <Select
              value={String(state.abilityMultiplier)}
              onValueChange={(value) => set({ abilityMultiplier: Number(value) })}
              options={ABILITY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))}
            />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-primary text-sm font-semibold">목표</h2>
        <Field label="추월할 스피드 실수치">
          <NumberField
            value={state.targetSpeed}
            min={1}
            max={1000}
            onValueChange={(value) => set({ targetSpeed: value })}
          />
        </Field>
        <Field label="상대 종족으로 채우기(최대투자 가정)">
          <div className="flex items-center gap-2">
            <PokemonPicker value={targetSpecies} onSelect={setTargetSpecies} />
            <button type="button" onClick={fillFromSpecies} className="text-primary shrink-0 text-sm underline">
              채우기
            </button>
          </div>
        </Field>
      </Card>

      <Card className="md:col-span-2">
        {!result ? (
          <p className="text-muted-foreground text-sm">포켓몬을 정확히 입력하라.</p>
        ) : result.evNeeded === null ? (
          <p className="text-destructive text-sm font-medium">
            최대 투자로도 추월 불가 (내 최대 스피드 {result.maxSpeed}, 목표 {state.targetSpeed}).
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <ResultRow label="필요 스피드 노력치" value={`${result.evNeeded} / 32`} strong />
            <ResultRow label="달성 스피드" value={`${result.achievedSpeed} (목표 ${state.targetSpeed} 추월)`} />
            <ResultRow label="여유 포인트" value={`${32 - result.evNeeded} 포인트를 다른 곳에`} />
          </div>
        )}
      </Card>
    </div>
  );
};
