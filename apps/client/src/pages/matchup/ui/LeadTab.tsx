import {
  type BattleState,
  findMegasBySpecies,
  findPokemon,
  matchup,
  type MegaForm,
  speciesDisplayName,
} from '@pokedex-agent/pokedex-core';
import { Plus, Users, X } from 'lucide-react';

import { cn } from '@/common/lib/cn';
import { Badge } from '@/common/ui/Badge';
import { Button } from '@/common/ui/Button';
import { Card } from '@/common/ui/Card';
import { useMatchupLeadrec } from '@/features/advisor/model/useMatchupLeadrec';
import { PokemonDatalist } from '@/features/pokemon-picker/ui/PokemonDatalist';
import { PokemonIcon } from '@/features/pokemon-picker/ui/PokemonIcon';
import { PokemonPicker } from '@/features/pokemon-picker/ui/PokemonPicker';
import { buildParty } from '@/pages/party/lib/party';
import { usePartyStore } from '@/pages/party/model/store';

import { MAX_OPPONENTS, useMatchupStore } from '../model/store';
import { type LeadRank, LeadrecResult } from './LeadrecResult';
import { MegaFormSection } from './MegaFormSection';

const resolveMegaContext = (
  speciesList: ReadonlyArray<string>,
  formBySpecies: Record<string, string>,
): Map<string, MegaForm> => {
  const result = new Map<string, MegaForm>();
  for (const species of speciesList) {
    const slug = formBySpecies[species];
    if (!slug) {
      continue;
    }
    const mega = findMegasBySpecies(species).find((m) => m.form === slug);
    if (mega) {
      result.set(species, mega);
    }
  }
  return result;
};

const verdictVariant = (verdict: matchup.MatchupVerdict): 'success' | 'destructive' | 'muted' =>
  verdict === '유리' ? 'success' : verdict === '불리' ? 'destructive' : 'muted';

export const LeadTab = () => {
  const members = usePartyStore((state) => state.members);
  const {
    opponents,
    myMegaForms,
    opponentMegaForms,
    selectedSpecies,
    setOpponent,
    addOpponent,
    removeOpponent,
    setMyMegaForm,
    setOpponentMegaForm,
    setSelectedSpecies,
  } = useMatchupStore();
  const advise = useMatchupLeadrec();

  const myParty = buildParty(members);
  const validOpponents = opponents.filter((name) => findPokemon(name));
  const myMegaByPick = resolveMegaContext(
    myParty.map((m) => m.species),
    myMegaForms,
  );
  const opponentMegaBySpecies = resolveMegaContext(validOpponents, opponentMegaForms);
  const matchupContext = { myMegaByPick, opponentMegaBySpecies };
  const board = matchup.leadBoard(myParty, validOpponents, matchupContext);
  const cover = matchup.coverage(myParty, validOpponents, matchupContext);
  const lineups = matchup.lineupBoard(myParty, validOpponents, matchupContext);
  const autoPicks = lineups[0]?.picks ?? [];

  const myMegaPicks = myParty.map((m) => m.species).filter((species) => findMegasBySpecies(species).length > 0);
  const opponentMegaPicks = validOpponents.filter((species) => findMegasBySpecies(species).length > 0);

  const effectiveSelection = selectedSpecies.length > 0 ? selectedSpecies : autoPicks;
  const selectedParty = myParty.filter((member) => effectiveSelection.includes(member.species));
  const selectedBoard = matchup.leadBoard(selectedParty, validOpponents, matchupContext);
  const isReady = selectedParty.length === matchup.LINEUP_SIZE;

  const leadRanks: LeadRank[] = selectedBoard.map((entry, index) => ({
    pick: entry.myPick,
    rank: index + 1,
  }));

  const handleToggleSelected = (species: string) => {
    const next = effectiveSelection.includes(species)
      ? effectiveSelection.filter((value) => value !== species)
      : [...effectiveSelection, species];
    setSelectedSpecies(next);
  };

  const state: BattleState = {
    my: selectedParty,
    opponent: { revealed: validOpponents.map((species) => ({ species })), field: [] },
    myField: [],
    trickRoom: false,
    turn: 1,
  };

  return (
    <>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Users className="text-muted-foreground size-4" />
          <h2 className="text-sm font-semibold">상대 공개분</h2>
          <Badge variant="muted" className="ml-1">
            {opponents.length}/{MAX_OPPONENTS}
          </Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {opponents.map((opponent, index) => (
            <div key={index} className="flex items-center gap-1">
              <PokemonPicker
                value={opponent}
                invalid={Boolean(opponent) && !findPokemon(opponent)}
                onSelect={(name) => setOpponent(index, name)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeOpponent(index)}
                aria-label="상대 삭제"
                className="text-muted-foreground hover:text-destructive size-8"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        {opponents.length < MAX_OPPONENTS && (
          <Button variant="outline" size="sm" className="w-fit" onClick={addOpponent}>
            <Plus className="size-3.5" />
            상대 추가
          </Button>
        )}
      </Card>

      {myParty.length === 0 || validOpponents.length === 0 ? (
        <Card>
          <p className="text-muted-foreground text-sm">
            파티빌더에서 내 파티를, 위에서 상대 포켓몬을 입력하면 매치업이 계산된다.
          </p>
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-4 overflow-x-auto">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">매치업 매트릭스</h2>
              <Badge variant="muted">
                커버리지 {cover.covered}/{cover.total}
              </Badge>
            </div>

            {/* 메가 설정 영역. 매트릭스에서 메가 컨트롤을 분리해 컬럼 width를 균등하게 유지한다. */}
            <MegaFormSection
              myMegaPicks={myMegaPicks}
              opponentMegaPicks={opponentMegaPicks}
              myMegaForms={myMegaForms}
              opponentMegaForms={opponentMegaForms}
              onMyMegaChange={setMyMegaForm}
              onOpponentMegaChange={setOpponentMegaForm}
            />

            <table className="w-full table-fixed border-collapse text-xs">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground w-32 p-2 text-left text-xs font-medium">내 픽 \ 상대</th>
                  {validOpponents.map((opponent) => (
                    <th key={opponent} className="text-foreground p-2 align-bottom font-medium">
                      <span className="flex flex-col items-center gap-1">
                        <PokemonIcon species={opponent} className="h-8 w-8" />
                        <span className="text-xs">{speciesDisplayName(opponent, opponentMegaForms[opponent])}</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myParty.map((member, rowIndex) => (
                  <tr key={`${member.species}-${rowIndex}`} className="border-border/40 hover:bg-muted/40 border-b">
                    <td className="text-foreground w-32 p-2 text-center font-medium">
                      <span className="flex flex-col items-center gap-1">
                        <PokemonIcon species={member.species} className="h-8 w-8" />
                        <span className="text-sm">
                          {speciesDisplayName(member.species, myMegaForms[member.species])}
                        </span>
                      </span>
                    </td>
                    {validOpponents.map((opponent) => {
                      const score = matchup.pairwise(member, opponent, matchupContext);
                      return (
                        <td key={opponent} className="p-2 text-center align-middle">
                          {score && (
                            <Badge variant={verdictVariant(score.verdict)} size="md">
                              {score.verdict}
                            </Badge>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">선출</h2>
                <Badge variant={isReady ? 'success' : 'muted'}>
                  {selectedParty.length}/{matchup.LINEUP_SIZE}
                </Badge>
              </div>
              {selectedSpecies.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedSpecies([])}>
                  자동 추천으로 복귀
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {myParty.map((member) => {
                const selected = effectiveSelection.includes(member.species);
                return (
                  <button
                    key={member.species}
                    type="button"
                    onClick={() => handleToggleSelected(member.species)}
                    className={cn(
                      'flex flex-col items-center gap-1.5',
                      'rounded-lg border px-2 py-3',
                      selected
                        ? 'border-primary/60 bg-primary/10 shadow-[0_0_0_1px_var(--color-primary)]/30'
                        : 'border-border bg-card hover:border-foreground/30 hover:bg-muted/40',
                      'transition',
                    )}
                  >
                    <PokemonIcon species={member.species} className="h-11 w-11" />
                    <span
                      className={cn('text-xs', selected ? 'text-foreground font-semibold' : 'text-muted-foreground')}
                    >
                      {speciesDisplayName(member.species, myMegaForms[member.species])}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-muted-foreground text-xs">
              자동 추천 ·{' '}
              {autoPicks.length > 0 ? `${autoPicks.join(', ')} (${lineups[0]?.finalScore ?? 0}점)` : '(불가)'}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {!isReady ? (
                <p className="text-warning text-xs">정확히 {matchup.LINEUP_SIZE}마리를 골라야 추천을 요청할 수 있다.</p>
              ) : (
                <span />
              )}
              <Button
                onClick={() => advise.mutate({ state, megaForms: { my: myMegaForms, opponent: opponentMegaForms } })}
                disabled={advise.isPending || !isReady || validOpponents.length === 0}
              >
                {advise.isPending ? '추천 중...' : '선두 추천 요청'}
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold">
              선두 추천 점수 <span className="text-muted-foreground ml-1 text-xs font-normal">참고용</span>
            </h2>
            <ul className="divide-border/40 flex flex-col divide-y">
              {board.map((lead) => (
                <li key={lead.myPick} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <span className="flex items-center gap-2 text-sm">
                    <PokemonIcon species={lead.myPick} className="h-8 w-8" />
                    <span className="font-medium">{speciesDisplayName(lead.myPick, myMegaForms[lead.myPick])}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="muted">{lead.finalScore}점</Badge>
                    <span className="text-muted-foreground text-xs">
                      유리 <span className="text-success">{lead.favorable}</span> · 불리{' '}
                      <span className="text-destructive">{lead.unfavorable}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {advise.isError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <p className="text-destructive text-sm">
            {advise.error instanceof Error ? advise.error.message : '추천 실패'}
          </p>
        </Card>
      )}
      {advise.isSuccess && <LeadrecResult result={advise.data} ranks={leadRanks} />}

      <PokemonDatalist />
    </>
  );
};
