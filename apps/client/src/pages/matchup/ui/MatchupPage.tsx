import { findPokemon, matchup, type BattleState } from "@pokedex-agent/pokedex-core";

import { cn } from "@/common/lib/cn";
import { Button } from "@/common/ui/Button";
import { Card } from "@/common/ui/Card";
import { useMatchupLeadrec } from "@/features/advisor/model/useMatchupLeadrec";
import { AnalysisResult } from "@/features/advisor/ui/AnalysisResult";
import { PokemonDatalist } from "@/features/pokemon-picker/ui/PokemonDatalist";
import { PokemonIcon } from "@/features/pokemon-picker/ui/PokemonIcon";
import { PokemonPicker } from "@/features/pokemon-picker/ui/PokemonPicker";
import { buildParty } from "@/pages/party/lib/party";
import { usePartyStore } from "@/pages/party/model/store";

import { MAX_OPPONENTS, useMatchupStore } from "../model/store";

const verdictClass = (verdict: matchup.MatchupVerdict): string =>
  verdict === "유리"
    ? "bg-emerald-900 text-emerald-300"
    : verdict === "불리"
      ? "bg-rose-900 text-rose-300"
      : "bg-neutral-800 text-neutral-400";

export const MatchupPage = () => {
  const members = usePartyStore((state) => state.members);
  const { opponents, setOpponent, addOpponent, removeOpponent } = useMatchupStore();
  const advise = useMatchupLeadrec();

  const myParty = buildParty(members);
  const validOpponents = opponents.filter((name) => findPokemon(name));
  const board = matchup.leadBoard(myParty, validOpponents);
  const cover = matchup.coverage(myParty, validOpponents);

  const state: BattleState = {
    my: myParty,
    opponent: { revealed: validOpponents.map((species) => ({ species })), field: [] },
    myField: [],
    trickRoom: false,
    turn: 1,
  };

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">매치업</h1>
        <Button
          onClick={() => advise.mutate(state)}
          disabled={advise.isPending || myParty.length === 0 || validOpponents.length === 0}
        >
          {advise.isPending ? "추천 중..." : "선두 추천 요청"}
        </Button>
      </header>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-sky-400">상대 공개분</h2>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {opponents.map((opponent, index) => (
            <div key={index} className="flex items-center gap-1">
              <PokemonPicker
                value={opponent}
                invalid={Boolean(opponent) && !findPokemon(opponent)}
                onSelect={(name) => setOpponent(index, name)}
              />
              <button
                type="button"
                onClick={() => removeOpponent(index)}
                className="px-1 text-xs text-neutral-500 hover:text-rose-400"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        {opponents.length < MAX_OPPONENTS && (
          <Button variant="secondary" className="w-fit" onClick={addOpponent}>
            상대 추가
          </Button>
        )}
      </Card>

      {myParty.length === 0 || validOpponents.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-400">
            파티빌더에서 내 파티를, 위에서 상대 종족을 입력하면 매치업이 계산된다.
          </p>
        </Card>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <h2 className="mb-2 text-sm font-semibold text-neutral-300">
              매치업 매트릭스 (상대 커버리지 {cover.covered}/{cover.total})
            </h2>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-left text-neutral-500">내 픽 \ 상대</th>
                  {validOpponents.map((opponent) => (
                    <th key={opponent} className="p-1 text-neutral-400">
                      {opponent}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myParty.map((member, rowIndex) => (
                  <tr key={`${member.species}-${rowIndex}`}>
                    <td className="p-1 font-medium text-neutral-200">
                      <span className="flex items-center gap-1">
                        <PokemonIcon species={member.species} className="h-8 w-8" />
                        {member.species}
                      </span>
                    </td>
                    {validOpponents.map((opponent) => {
                      const score = matchup.pairwise(member, opponent);
                      return (
                        <td key={opponent} className="p-1 text-center">
                          {score && (
                            <span className={cn("rounded px-1.5 py-0.5", verdictClass(score.verdict))}>
                              {score.verdict}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <h2 className="mb-2 text-sm font-semibold text-neutral-300">선두 추천 점수 (참고용)</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {board.map((lead) => (
                <li key={lead.myPick} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-neutral-200">
                    <PokemonIcon species={lead.myPick} className="h-8 w-8" />
                    {lead.myPick}
                  </span>
                  <span className="text-neutral-400">
                    {lead.finalScore}점 (유리 {lead.favorable} / 불리 {lead.unfavorable})
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {advise.isError && (
        <Card>
          <p className="text-sm text-rose-400">
            {advise.error instanceof Error ? advise.error.message : "추천 실패"}
          </p>
        </Card>
      )}
      {advise.data && <AnalysisResult result={advise.data} />}

      <PokemonDatalist />
    </section>
  );
};
