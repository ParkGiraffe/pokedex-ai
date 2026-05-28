import { findPokemon } from "@pokedex-agent/pokedex-core";

import { cn } from "@/common/lib/cn";

type PokemonIconProps = {
  species: string;
  className?: string;
};

export const PokemonIcon = ({ species, className }: PokemonIconProps) => {
  const entry = findPokemon(species);
  if (!entry) {
    return null;
  }
  return (
    <img
      src={`/sprites/${entry.no}.png`}
      alt={species}
      loading="lazy"
      className={cn("inline-block h-11 w-11 shrink-0 object-contain", className)}
    />
  );
};
