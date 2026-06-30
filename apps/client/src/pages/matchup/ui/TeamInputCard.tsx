import { Plus, X } from 'lucide-react';

import { cn } from '@/common/lib/cn';
import { Badge } from '@/common/ui/Badge';
import { Button } from '@/common/ui/Button';
import { Card } from '@/common/ui/Card';
import { POKEMON_DATALIST_ID } from '@/features/pokemon-picker';
import { PokemonIcon } from '@/features/pokemon-picker';

export const MAX_TEAM = 6;

type TeamEntry = { id: number; species: string };

type TeamInputCardProps = {
  title: string;
  team: TeamEntry[];
  removeAriaLabel: string;
  onSpeciesChange: (id: number, species: string) => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
};

export const TeamInputCard = ({
  title,
  team,
  removeAriaLabel,
  onSpeciesChange,
  onAdd,
  onRemove,
}: TeamInputCardProps) => (
  <Card className="flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <Badge variant="muted">
        {team.length}/{MAX_TEAM}
      </Badge>
    </div>
    <div className="flex flex-col gap-2">
      {team.map((entry) => (
        <div key={entry.id} className="flex items-center gap-2">
          {entry.species.trim().length > 0 && (
            <PokemonIcon species={entry.species.trim()} className="h-7 w-7 shrink-0" />
          )}
          <input
            type="text"
            list={POKEMON_DATALIST_ID}
            value={entry.species}
            onChange={(e) => onSpeciesChange(entry.id, e.target.value)}
            placeholder="종족 이름"
            className={cn(
              'min-w-0 flex-1 rounded-md border px-3 py-1.5',
              'border-border bg-background text-sm',
              'focus:ring-ring placeholder:text-muted-foreground focus:ring-2 focus:outline-none',
            )}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(entry.id)}
            aria-label={removeAriaLabel}
            className="text-muted-foreground hover:text-destructive size-8 shrink-0"
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
    </div>
    {team.length < MAX_TEAM && (
      <Button variant="outline" size="sm" className="w-fit" onClick={onAdd}>
        <Plus className="size-3.5" />
        추가
      </Button>
    )}
  </Card>
);
