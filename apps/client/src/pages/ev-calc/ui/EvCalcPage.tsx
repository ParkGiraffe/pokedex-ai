import { NATURE_NAMES, type NatureName, type TeraType, TYPE_NAMES, type TypeName } from '@pokedex-agent/pokedex-core';
import { useMemo, useState } from 'react';

import { cn } from '@/common/lib/cn';
import { Card } from '@/common/ui/Card';
import { Checkbox } from '@/common/ui/Checkbox';
import { Field } from '@/common/ui/Field';
import { NumberField } from '@/common/ui/NumberField';
import { Select } from '@/common/ui/Select';
import { PokemonDatalist } from '@/features/pokemon-picker/ui/PokemonDatalist';
import { PokemonIcon } from '@/features/pokemon-picker/ui/PokemonIcon';
import { PokemonPicker } from '@/features/pokemon-picker/ui/PokemonPicker';

import {
  assumedSpeed,
  type BulkInput,
  optimizeBulk,
  optimizePower,
  optimizeSpeed,
  type SpeedReverseInput,
} from '../lib/optimize';

type Mode = 'bulk' | 'speed' | 'power';
type Category = '물리' | '특수';

const MODES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'bulk', label: '내구 역산' },
  { value: 'speed', label: '스피드 역산' },
  { value: 'power', label: '화력 역산' },
];

const ITEM_OPTIONS = [
  { value: 1, label: '없음' },
  { value: 1.2, label: '안경/머리띠 1.2배' },
  { value: 1.3, label: '생명의구슬 1.3배' },
  { value: 1.5, label: '구애 1.5배' },
] as const;

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

const natureOptions = NATURE_NAMES.map((nature) => ({ value: nature, label: nature }));
const typeOptions = TYPE_NAMES.map((type) => ({ value: type, label: type }));

// 모드 공통 기본 공격 정보.
const DEFAULT_ATTACK = {
  attackerSpecies: '한카리아스',
  attackerLevel: 50,
  attackerNature: '고집' as NatureName,
  attackerEv: 32,
  category: '물리' as Category,
  moveType: '땅' as TypeName,
  movePower: 100,
  itemMultiplier: 1,
  terastalized: false,
  teraType: '땅' as TeraType,
};

type BulkState = typeof DEFAULT_ATTACK & {
  defenderSpecies: string;
  defenderLevel: number;
  defenderNature: NatureName;
  hits: number;
};

const ResultRow = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-baseline justify-between gap-3">
    <span className="text-muted-foreground text-sm">{label}</span>
    <span className={cn('text-sm', strong ? 'text-primary text-lg font-bold' : 'text-foreground font-medium')}>
      {value}
    </span>
  </div>
);

const BulkMode = () => {
  const [state, setState] = useState<BulkState>({
    ...DEFAULT_ATTACK,
    defenderSpecies: '도가스',
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

const SpeedMode = () => {
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

const PowerMode = () => {
  const [state, setState] = useState({
    ...DEFAULT_ATTACK,
    defenderSpecies: '도가스',
    defenderLevel: 50,
    defenderNature: '신중' as NatureName,
    defenderHpEv: 0,
    defenderDefEv: 0,
    targetHits: 2,
    guaranteed: true,
  });
  const set = (patch: Partial<typeof state>) => setState((prev) => ({ ...prev, ...patch }));

  const result = useMemo(
    () =>
      optimizePower({
        attackerSpecies: state.attackerSpecies,
        attackerLevel: state.attackerLevel,
        attackerNature: state.attackerNature,
        attack: {
          level: state.attackerLevel,
          category: state.category,
          moveType: state.moveType,
          movePower: state.movePower,
          itemMultiplier: state.itemMultiplier,
          terastalized: state.terastalized,
          teraType: state.teraType,
        },
        defenderSpecies: state.defenderSpecies,
        defenderLevel: state.defenderLevel,
        defenderNature: state.defenderNature,
        defenderHpEv: state.defenderHpEv,
        defenderDefEv: state.defenderDefEv,
        targetHits: state.targetHits,
        guaranteed: state.guaranteed,
      }),
    [state],
  );

  const attackEvLabel = state.category === '물리' ? '공격' : '특공';

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="flex flex-col gap-3">
        <h2 className="text-primary text-sm font-semibold">공격(나)</h2>
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

      <Card className="flex flex-col gap-3">
        <h2 className="text-info text-sm font-semibold">대상(상대)</h2>
        <Field label="포켓몬">
          <div className="flex items-center gap-2">
            <PokemonIcon species={state.defenderSpecies} />
            <PokemonPicker value={state.defenderSpecies} onSelect={(name) => set({ defenderSpecies: name })} />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="HP 노력치">
            <NumberField
              value={state.defenderHpEv}
              min={0}
              max={32}
              onValueChange={(value) => set({ defenderHpEv: value })}
            />
          </Field>
          <Field label="방어 노력치">
            <NumberField
              value={state.defenderDefEv}
              min={0}
              max={32}
              onValueChange={(value) => set({ defenderDefEv: value })}
            />
          </Field>
          <Field label="성격">
            <Select
              value={state.defenderNature}
              onValueChange={(value) => set({ defenderNature: value as NatureName })}
              options={natureOptions}
            />
          </Field>
          <Field label="목표 타수">
            <NumberField
              value={state.targetHits}
              min={1}
              max={5}
              onValueChange={(value) => set({ targetHits: value })}
            />
          </Field>
        </div>
        <Checkbox
          checked={state.guaranteed}
          onCheckedChange={(checked) => set({ guaranteed: checked })}
          label="확정(끄면 난수 허용)"
        />
      </Card>

      <Card className="md:col-span-2">
        {!result ? (
          <p className="text-muted-foreground text-sm">포켓몬을 정확히 입력하라.</p>
        ) : result.evNeeded === null ? (
          <p className="text-destructive text-sm font-medium">
            최대 투자로도 목표 {state.targetHits}타 불가 (최대 {result.maxDamagePercent.toFixed(1)}%,{' '}
            {result.achievedHitsText}).
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <ResultRow label={`필요 ${attackEvLabel} 노력치`} value={`${result.evNeeded} / 32`} strong />
            <ResultRow
              label="달성"
              value={`${state.guaranteed ? '확정' : '난수'} ${state.targetHits}타 (${result.achievedHitsText})`}
            />
            <ResultRow label="여유 포인트" value={`${32 - result.evNeeded} 포인트를 다른 곳에`} />
          </div>
        )}
      </Card>
    </div>
  );
};

export const EvCalcPage = () => {
  const [mode, setMode] = useState<Mode>('bulk');

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">노력치 역산기</h1>
        <div className="flex gap-1">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setMode(item.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition',
                mode === item.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {mode === 'bulk' && <BulkMode />}
      {mode === 'speed' && <SpeedMode />}
      {mode === 'power' && <PowerMode />}

      <PokemonDatalist />
    </section>
  );
};
