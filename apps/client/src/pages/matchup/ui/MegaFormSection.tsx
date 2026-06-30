import { MegaControl } from '@/features/pokemon-picker';
import { PokemonIcon } from '@/features/pokemon-picker';

type MegaFormSectionProps = {
  myMegaPicks: string[];
  opponentMegaPicks: string[];
  myMegaForms: Record<string, string>;
  opponentMegaForms: Record<string, string>;
  onMyMegaChange: (species: string, form: string) => void;
  onOpponentMegaChange: (species: string, form: string) => void;
};

export const MegaFormSection = ({
  myMegaPicks,
  opponentMegaPicks,
  myMegaForms,
  opponentMegaForms,
  onMyMegaChange,
  onOpponentMegaChange,
}: MegaFormSectionProps) => {
  if (myMegaPicks.length === 0 && opponentMegaPicks.length === 0) {
    return null;
  }

  return (
    <div className="border-border/60 bg-muted/20 grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
      {myMegaPicks.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">내 메가</p>
          <div className="flex flex-col gap-3">
            {myMegaPicks.map((species) => (
              <div key={species} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <PokemonIcon species={species} className="h-7 w-7" />
                  <span className="text-sm font-medium">{species}</span>
                </div>
                <MegaControl
                  species={species}
                  value={myMegaForms[species] ?? ''}
                  onChange={(form) => onMyMegaChange(species, form)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {opponentMegaPicks.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">상대 메가</p>
          <div className="flex flex-col gap-3">
            {opponentMegaPicks.map((species) => (
              <div key={species} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <PokemonIcon species={species} className="h-7 w-7" />
                  <span className="text-sm font-medium">{species}</span>
                </div>
                <MegaControl
                  species={species}
                  value={opponentMegaForms[species] ?? ''}
                  onChange={(form) => onOpponentMegaChange(species, form)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
