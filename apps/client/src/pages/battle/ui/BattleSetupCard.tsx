import { type Weather } from '@pokedex-agent/pokedex-core';

import { Card } from '@/common/ui/Card';
import { Field } from '@/common/ui/Field';
import { NumberField } from '@/common/ui/NumberField';
import { Select } from '@/common/ui/Select';
import { PokemonPicker } from '@/features/pokemon-picker/ui/PokemonPicker';

const WEATHERS: Weather[] = ['맑음', '비', '모래바람', '눈'];

type BattleSetupCardProps = {
  turn: number;
  weather: Weather | '';
  opponentSpecies: string;
  onTurnChange: (value: number) => void;
  onWeatherChange: (value: Weather | '') => void;
  onOpponentSpeciesChange: (name: string) => void;
};

export const BattleSetupCard = ({
  turn,
  weather,
  opponentSpecies,
  onTurnChange,
  onWeatherChange,
  onOpponentSpeciesChange,
}: BattleSetupCardProps) => (
  <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <Field label="턴">
      <NumberField value={turn} min={1} onValueChange={onTurnChange} />
    </Field>
    <Field label="날씨">
      <Select
        value={weather}
        onValueChange={(value) => onWeatherChange(value as Weather | '')}
        options={[{ value: '', label: '없음' }, ...WEATHERS.map((w) => ({ value: w, label: w }))]}
      />
    </Field>
    <Field label="상대 포켓몬">
      <PokemonPicker value={opponentSpecies} onSelect={onOpponentSpeciesChange} />
    </Field>
  </Card>
);
