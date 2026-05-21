import { pokedex } from "@pokedex-agent/pokedex-core";

export const POKEMON_DATALIST_ID = "pokemon-options";

export const PokemonDatalist = () => (
  <datalist id={POKEMON_DATALIST_ID}>
    {pokedex.entries.map((entry) => (
      <option key={entry.no} value={entry.ko} />
    ))}
  </datalist>
);
