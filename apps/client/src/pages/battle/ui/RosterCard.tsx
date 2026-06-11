import { type Party } from '@pokedex-agent/pokedex-core';

import { cn } from '@/common/lib/cn';
import { Badge } from '@/common/ui/Badge';
import { Card } from '@/common/ui/Card';
import { PokemonIcon } from '@/features/pokemon-picker/ui/PokemonIcon';

type RosterCardProps = {
  myParty: Party;
  effectiveRoster: string[];
  onToggleRoster: (species: string) => void;
};

export const RosterCard = ({ myParty, effectiveRoster, onToggleRoster }: RosterCardProps) => {
  const rosterCount = myParty.filter((member) => effectiveRoster.includes(member.species)).length;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">생존 포켓몬</h2>
        <Badge variant="muted">
          {rosterCount}/{myParty.length}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {myParty.map((member) => {
          const alive = effectiveRoster.includes(member.species);
          return (
            <button
              key={member.species}
              type="button"
              onClick={() => onToggleRoster(member.species)}
              className={cn(
                'flex flex-col items-center gap-1.5',
                'rounded-lg border px-2 py-3',
                alive ? 'border-primary/60 bg-primary/10' : 'border-border bg-card opacity-40 hover:opacity-100',
                'transition',
              )}
            >
              <PokemonIcon species={member.species} className="h-11 w-11" />
              <span className={cn('text-xs', alive ? 'text-foreground font-semibold' : 'text-muted-foreground')}>
                {member.species}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">기절한 포켓몬은 토글을 꺼서 액티브·교체 후보에서 제외</p>
    </Card>
  );
};
