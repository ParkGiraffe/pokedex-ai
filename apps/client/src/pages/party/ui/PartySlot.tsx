import { NATURE_NAMES, TYPE_NAMES } from '@pokedex-agent/pokedex-core';

import { STAT_LABEL_KO } from '@/common/lib/stat';
import { Card } from '@/common/ui/Card';
import { Field } from '@/common/ui/Field';
import { Input } from '@/common/ui/Input';
import { NumberField } from '@/common/ui/NumberField';
import { Select } from '@/common/ui/Select';
import { PokemonIcon } from '@/features/pokemon-picker/ui/PokemonIcon';
import { PokemonPicker } from '@/features/pokemon-picker/ui/PokemonPicker';

import { memberError } from '../lib/party';
import { type MemberDraft } from '../model/store';

const TERA_OPTIONS = [...TYPE_NAMES, '스텔라'] as const;
const EV_KEYS: Array<keyof MemberDraft['evs']> = ['H', 'A', 'B', 'C', 'D', 'S'];

type SlotProps = {
  index: number;
  draft: MemberDraft;
  onChange: (patch: Partial<MemberDraft>) => void;
  onRemove: () => void;
};

export const PartySlot = ({ index, draft, onChange, onRemove }: SlotProps) => {
  const error = memberError(draft);
  const evSum = EV_KEYS.reduce((total, key) => total + draft.evs[key], 0);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
          슬롯 {index + 1}
          <PokemonIcon species={draft.species} className="h-9 w-9" />
        </span>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive text-xs">
          삭제
        </button>
      </div>

      <Field label="포켓몬">
        <PokemonPicker
          value={draft.species}
          invalid={Boolean(error)}
          onSelect={(name) => onChange({ species: name })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="특성">
          <Input value={draft.ability} onChange={(event) => onChange({ ability: event.currentTarget.value })} />
        </Field>
        <Field label="도구">
          <Input value={draft.item} onChange={(event) => onChange({ item: event.currentTarget.value })} />
        </Field>
        <Field label="성격">
          <Select
            value={draft.nature}
            onValueChange={(value) => onChange({ nature: value as (typeof NATURE_NAMES)[number] })}
            options={NATURE_NAMES.map((nature) => ({ value: nature, label: nature }))}
          />
        </Field>
        <Field label="테라">
          <Select
            value={draft.teraType}
            onValueChange={(value) => onChange({ teraType: value as (typeof TERA_OPTIONS)[number] })}
            options={TERA_OPTIONS.map((tera) => ({ value: tera, label: tera }))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {draft.moves.map((move, moveIndex) => (
          <Input
            key={moveIndex}
            value={move}
            placeholder={`기술 ${moveIndex + 1}`}
            onChange={(event) => {
              const moves = [...draft.moves] as MemberDraft['moves'];
              moves[moveIndex] = event.currentTarget.value;
              onChange({ moves });
            }}
          />
        ))}
      </div>

      <div>
        <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
          <span>노력치</span>
          <span>합계 {evSum}</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {EV_KEYS.map((key) => (
            <label key={key} className="flex flex-col items-center gap-0.5">
              <span className="text-muted-foreground text-[10px]">{STAT_LABEL_KO[key]}</span>
              <NumberField
                value={draft.evs[key]}
                min={0}
                max={32}
                step={1}
                onValueChange={(point) => onChange({ evs: { ...draft.evs, [key]: point } })}
                className="px-1 text-center"
              />
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}
    </Card>
  );
};
