import { findMegasBySpecies, findPokemon, matchup, type BattleState, type MegaForm } from "@pokedex-agent/pokedex-core";

import { cn } from "@/common/lib/cn";
import { Button } from "@/common/ui/Button";
import { Card } from "@/common/ui/Card";
import { Select } from "@/common/ui/Select";
import { useMatchupLeadrec } from "@/features/advisor/model/useMatchupLeadrec";
import { PokemonDatalist } from "@/features/pokemon-picker/ui/PokemonDatalist";
import { PokemonIcon } from "@/features/pokemon-picker/ui/PokemonIcon";
import { PokemonPicker } from "@/features/pokemon-picker/ui/PokemonPicker";
import { buildParty } from "@/pages/party/lib/party";
import { usePartyStore } from "@/pages/party/model/store";

import { MAX_OPPONENTS, useMatchupStore } from "../model/store";
import { type LeadRank, LeadrecResult } from "./LeadrecResult";

// 종족명 → 메가 폼 슬러그 매핑을 Map<species, MegaForm>으로 해석한다 (matchup context용).
const resolveMegaContext = (
  speciesList: ReadonlyArray<string>,
  formBySpecies: Record<string, string>
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

type MegaControlProps = {
  species: string;
  value: string;
  onChange: (form: string) => void;
};

// 종족이 메가 가능 시 1개면 토글, 2개(X/Y)면 select. 메가 폼 한국어 라벨을 표시한다.
const MegaControl = ({ species, value, onChange }: MegaControlProps) => {
  const options = findMegasBySpecies(species);
  if (options.length === 0) {
    return null;
  }
  if (options.length === 1) {
    const only = options[0]!;
    return (
      <label className="flex items-center gap-1 text-xs text-neutral-300">
        <input
          type="checkbox"
          checked={value === only.form}
          onChange={(event) => onChange(event.currentTarget.checked ? only.form : "")}
        />
        {only.ko}
      </label>
    );
  }
  return (
    <Select value={value} onChange={(event) => onChange(event.currentTarget.value)} className="text-xs">
      <option value="">비메가</option>
      {options.map((mega) => (
        <option key={mega.form} value={mega.form}>
          {mega.ko}
        </option>
      ))}
    </Select>
  );
};

const verdictClass = (verdict: matchup.MatchupVerdict): string =>
  verdict === "유리"
    ? "bg-emerald-900 text-emerald-300"
    : verdict === "불리"
      ? "bg-rose-900 text-rose-300"
      : "bg-neutral-800 text-neutral-400";

export const MatchupPage = () => {
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
  const myMegaByPick = resolveMegaContext(myParty.map((m) => m.species), myMegaForms);
  const opponentMegaBySpecies = resolveMegaContext(validOpponents, opponentMegaForms);
  const matchupContext = { myMegaByPick, opponentMegaBySpecies };
  const board = matchup.leadBoard(myParty, validOpponents, matchupContext);
  const cover = matchup.coverage(myParty, validOpponents, matchupContext);
  const lineups = matchup.lineupBoard(myParty, validOpponents, matchupContext);
  const autoPicks = lineups[0]?.picks ?? [];

  // 사용자가 한 번이라도 체크박스를 건드렸으면 그 값을 그대로 보여준다(3마리가 아니어도).
  // 완전히 빈 상태일 때만 자동 추천(lineupBoard 1위)을 적용해서 디폴트로 채운다.
  const effectiveSelection = selectedSpecies.length > 0 ? selectedSpecies : autoPicks;
  const selectedParty = myParty.filter((member) => effectiveSelection.includes(member.species));
  const selectedBoard = matchup.leadBoard(selectedParty, validOpponents, matchupContext);
  const isReady = selectedParty.length === matchup.LINEUP_SIZE;

  // 선출 3마리 안에서 leadScore 내림차순으로 1·2·3순위. 모델은 이 순서를 뒤집을 수 없다.
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
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">매치업</h1>
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
                      <span className="flex flex-col items-center gap-0.5">
                        <span>{opponent}</span>
                        <MegaControl
                          species={opponent}
                          value={opponentMegaForms[opponent] ?? ""}
                          onChange={(form) => setOpponentMegaForm(opponent, form)}
                        />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myParty.map((member, rowIndex) => (
                  <tr key={`${member.species}-${rowIndex}`}>
                    <td className="p-1 font-medium text-neutral-200">
                      <span className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1">
                          <PokemonIcon species={member.species} className="h-8 w-8" />
                          {member.species}
                        </span>
                        <MegaControl
                          species={member.species}
                          value={myMegaForms[member.species] ?? ""}
                          onChange={(form) => setMyMegaForm(member.species, form)}
                        />
                      </span>
                    </td>
                    {validOpponents.map((opponent) => {
                      const score = matchup.pairwise(member, opponent, matchupContext);
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

          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-neutral-300">
                선출 ({selectedParty.length}/{matchup.LINEUP_SIZE})
              </h2>
              {selectedSpecies.length > 0 && (
                <Button
                  variant="secondary"
                  className="text-xs"
                  onClick={() => setSelectedSpecies([])}
                >
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
                      "flex flex-col items-center gap-1 rounded border px-2 py-1.5 transition",
                      selected
                        ? "border-emerald-500 bg-emerald-900/30"
                        : "border-neutral-700 bg-neutral-900 hover:border-neutral-500"
                    )}
                  >
                    <PokemonIcon species={member.species} className="h-9 w-9" />
                    <span className="text-xs text-neutral-200">{member.species}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-neutral-500">
              자동 추천: {autoPicks.length > 0 ? `${autoPicks.join(", ")} (${lineups[0]?.finalScore ?? 0}점)` : "(불가)"}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {!isReady ? (
                <p className="text-xs text-amber-400">
                  정확히 {matchup.LINEUP_SIZE}마리를 골라야 추천을 요청할 수 있다.
                </p>
              ) : (
                <span />
              )}
              <Button
                onClick={() => advise.mutate(state)}
                disabled={advise.isPending || !isReady || validOpponents.length === 0}
              >
                {advise.isPending ? "추천 중..." : "선두 추천 요청"}
              </Button>
            </div>
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
      {advise.data && <LeadrecResult result={advise.data} ranks={leadRanks} />}

      <PokemonDatalist />
    </section>
  );
};
