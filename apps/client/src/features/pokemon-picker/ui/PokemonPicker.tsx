import { findPokemon, type PokedexEntry } from '@pokedex-agent/pokedex-core';

import { Input } from '@/common/ui/Input';

import { POKEMON_DATALIST_ID } from './PokemonDatalist';

type PokemonPickerProps = {
  value: string;
  onSelect: (name: string, entry: PokedexEntry | undefined) => void;
  id?: string;
  invalid?: boolean;
};

export const PokemonPicker = ({ value, onSelect, id, invalid }: PokemonPickerProps) => (
  <Input
    id={id}
    list={POKEMON_DATALIST_ID}
    value={value}
    placeholder="포켓몬"
    aria-invalid={invalid}
    className={invalid ? 'border-destructive' : undefined}
    onChange={(event) => {
      const name = event.currentTarget.value.trim();
      onSelect(name, findPokemon(name));
    }}
  />
);
