import { type PartyDraft, speciesDisplayName } from '@pokedex-agent/pokedex-core';

import { Card } from '@/common/ui/Card';
import { PokemonIcon } from '@/features/pokemon-picker/ui/PokemonIcon';

const EV_LABEL: Record<string, string> = { H: 'HP', A: '공격', B: '방어', C: '특공', D: '특방', S: '스피드' };

const evSummary = (evs: PartyDraft[number]['evs']): string =>
  Object.entries(evs)
    .filter(([, value]) => value > 0)
    .map(([stat, value]) => `${EV_LABEL[stat] ?? stat} ${value}`)
    .join(' / ');

type PartyViewProps = {
  party: PartyDraft;
};

export const PartyView = ({ party }: PartyViewProps) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {party.map((member, index) => {
      const evs = evSummary(member.evs);
      const moves = member.moves.filter(Boolean);
      return (
        <Card key={index} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <PokemonIcon species={member.species} />
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-semibold">
                {speciesDisplayName(member.species) || '(빈 슬롯)'}
              </p>
              <p className="text-muted-foreground text-xs">
                Lv.{member.level} · {member.nature} · 테라 {member.teraType}
                {member.item ? ` · ${member.item}` : ''}
              </p>
            </div>
          </div>
          {member.ability && <p className="text-muted-foreground text-xs">특성: {member.ability}</p>}
          {moves.length > 0 && <p className="text-foreground text-xs">{moves.join(', ')}</p>}
          {evs && <p className="text-muted-foreground text-xs">노력치: {evs}</p>}
        </Card>
      );
    })}
  </div>
);
