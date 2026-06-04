import { speciesDisplayName, type StatusCondition, type Weather } from "@pokedex-agent/pokedex-core";

import { cn } from "@/common/lib/cn";
import { Button } from "@/common/ui/Button";
import { Card } from "@/common/ui/Card";
import { Field } from "@/common/ui/Field";
import { HpBar } from "@/common/ui/HpBar";
import { NumberField } from "@/common/ui/NumberField";
import { Select } from "@/common/ui/Select";
import { Badge } from "@/common/ui/Badge";
import { Checkbox } from "@/common/ui/Checkbox";
import { useBattleAdvice } from "@/features/advisor/model/useBattleAdvice";
import { AnalysisResult } from "@/features/advisor/ui/AnalysisResult";
import { MegaControl } from "@/features/pokemon-picker/ui/MegaControl";
import { PokemonDatalist } from "@/features/pokemon-picker/ui/PokemonDatalist";
import { PokemonIcon } from "@/features/pokemon-picker/ui/PokemonIcon";
import { PokemonPicker } from "@/features/pokemon-picker/ui/PokemonPicker";
import { buildParty } from "@/pages/party/lib/party";
import { usePartyStore } from "@/pages/party/model/store";

import { activeMegaOptions, battleAdvice, battleOptions, buildBattleState, opponentMegaOptions } from "../lib/battle";
import { type RankBlock, useBattleStore } from "../model/store";
import { AdvisorPanel } from "./AdvisorPanel";

const WEATHERS: Weather[] = ["맑음", "비", "모래바람", "눈"];
const STATUS_OPTIONS: StatusCondition[] = ["화상", "독", "맹독", "마비", "잠듦", "얼음"];
const RANK_KEYS: Array<keyof RankBlock> = ["A", "B", "C", "D", "S"];
const RANK_LABELS: Record<keyof RankBlock, string> = {
  A: "공격",
  B: "방어",
  C: "특공",
  D: "특방",
  S: "스피드",
};

export const BattlePage = () => {
  const members = usePartyStore((state) => state.members);
  const battle = useBattleStore();
  const advise = useBattleAdvice();

  const myParty = buildParty(members);
  const activeIndex = Math.min(battle.myActiveIndex, Math.max(0, myParty.length - 1));
  const input = {
    myParty,
    myActiveIndex: activeIndex,
    opponentSpecies: battle.opponentSpecies,
    opponentHpPercent: battle.opponentHpPercent,
    weather: battle.weather,
    trickRoom: battle.trickRoom,
    turn: battle.turn,
    myMegaForm: battle.myMegaForm,
    opponentMegaForm: battle.opponentMegaForm,
    myRanks: battle.myRanks,
    opponentRanks: battle.opponentRanks,
    myStatus: battle.myStatus,
    opponentStatus: battle.opponentStatus,
    rosterSpecies: battle.rosterSpecies,
    field: battle.field,
  };
  const myMegas = activeMegaOptions(input);
  const opponentMegas = opponentMegaOptions(input);
  const options = battleOptions(input);
  const advice = battleAdvice(input);
  const state = buildBattleState(input);

  // 살아있는 포켓몬 토글. 빈 배열이면 파티 전체가 생존 상태(디폴트). 1~6마리 자유.
  const effectiveRoster =
    battle.rosterSpecies.length > 0 ? battle.rosterSpecies : myParty.map((member) => member.species);
  const handleToggleRoster = (species: string) => {
    const next = effectiveRoster.includes(species)
      ? effectiveRoster.filter((value) => value !== species)
      : [...effectiveRoster, species];
    battle.setRosterSpecies(next);
  };
  const rosterParty = myParty.filter((member) => effectiveRoster.includes(member.species));

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">배틀</h1>
        {state && (
          <Button onClick={() => advise.mutate(state)} disabled={advise.isPending}>
            {advise.isPending ? "추천 중..." : "지금 뭐 할까?"}
          </Button>
        )}
      </header>

      <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="턴">
          <NumberField value={battle.turn} min={1} onValueChange={battle.setTurn} />
        </Field>
        <Field label="날씨">
          <Select
            value={battle.weather}
            onValueChange={(value) => battle.setWeather(value as Weather | "")}
            options={[
              { value: "", label: "없음" },
              ...WEATHERS.map((weather) => ({ value: weather, label: weather })),
            ]}
          />
        </Field>
        <Field label="상대 포켓몬">
          <PokemonPicker value={battle.opponentSpecies} onSelect={(name) => battle.setOpponentSpecies(name)} />
        </Field>
      </Card>

      {myParty.length > 0 && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">생존 포켓몬</h2>
            <Badge variant="muted">{rosterParty.length}/{myParty.length}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {myParty.map((member) => {
              const alive = effectiveRoster.includes(member.species);
              return (
                <button
                  key={member.species}
                  type="button"
                  onClick={() => handleToggleRoster(member.species)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 transition",
                    alive
                      ? "border-primary/60 bg-primary/10"
                      : "border-border bg-card opacity-40 hover:opacity-100"
                  )}
                >
                  <PokemonIcon species={member.species} className="h-11 w-11" />
                  <span className={cn("text-xs", alive ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {member.species}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">기절한 포켓몬은 토글을 꺼서 액티브·교체 후보에서 제외</p>
        </Card>
      )}

      {myParty.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">파티빌더에서 내 파티를 먼저 입력하라.</p>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-4">
            <div className="flex flex-col items-center gap-3 px-2">
              <Field label="전투 중인 포켓몬" className="w-full">
                <Select
                  value={String(activeIndex)}
                  onValueChange={(value) => battle.setMyActiveIndex(Number(value))}
                  options={myParty
                    .map((member, index) => ({ member, index }))
                    .filter(({ member }) => effectiveRoster.includes(member.species))
                    .map(({ member, index }) => ({ value: String(index), label: member.species }))}
                />
              </Field>
              <PokemonIcon species={myParty[activeIndex]?.species ?? ""} className="h-20 w-20" />
              <span className="text-base font-semibold text-foreground">
                {speciesDisplayName(myParty[activeIndex]?.species ?? "", battle.myMegaForm)}
              </span>
              {myMegas.length > 0 && myParty[activeIndex] && (
                <MegaControl
                  species={myParty[activeIndex]!.species}
                  value={battle.myMegaForm}
                  onChange={battle.setMyMegaForm}
                />
              )}
            </div>

            <div className="flex flex-col items-center justify-center gap-2 px-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">vs</span>
              {advice && (
                <span
                  className={cn(
                    "whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
                    advice.firstMove === "선공"
                      ? "bg-success/15 text-success"
                      : advice.firstMove === "후공"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {advice.firstMove === "동속" ? "동속 (50%)" : `내 ${advice.firstMove}`}
                </span>
              )}
              <div className="h-full w-px bg-border" />
            </div>

            <div className="flex flex-col items-center gap-3 px-2">
              <Field label="상대 HP %" className="w-full">
                <NumberField
                  value={battle.opponentHpPercent}
                  min={1}
                  max={100}
                  onValueChange={battle.setOpponentHpPercent}
                />
              </Field>
              <PokemonIcon species={battle.opponentSpecies} className="h-20 w-20" />
              <span className="text-base font-semibold text-foreground">
                {battle.opponentSpecies ? speciesDisplayName(battle.opponentSpecies, battle.opponentMegaForm) : "?"}
              </span>
              {opponentMegas.length > 0 && (
                <MegaControl
                  species={battle.opponentSpecies}
                  value={battle.opponentMegaForm}
                  onChange={battle.setOpponentMegaForm}
                />
              )}
              <HpBar percent={battle.opponentHpPercent} className="w-full" />
            </div>
          </div>

          {options ? (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="p-2 text-left font-medium">기술</th>
                  <th className="p-2 font-medium">타입</th>
                  <th className="p-2 font-medium">데미지</th>
                  <th className="p-2 font-medium">KO 확률</th>
                  <th className="p-2 font-medium">타수</th>
                </tr>
              </thead>
              <tbody>
                {options.map((option) => (
                  <tr key={option.move} className="border-b border-border/40 last:border-b-0 hover:bg-muted/40">
                    <td className="p-2 font-medium text-foreground">{option.move}</td>
                    <td className="p-2 text-center text-muted-foreground">{option.type}</td>
                    <td className="p-2 text-center text-foreground">
                      {option.damaging ? `${option.min}~${option.max}` : "변화기"}
                    </td>
                    <td
                      className={cn(
                        "p-2 text-center font-semibold",
                        option.koChance >= 1
                          ? "text-destructive"
                          : option.koChance > 0
                            ? "text-warning"
                            : "text-muted-foreground"
                      )}
                    >
                      {option.damaging ? `${Math.round(option.koChance * 100)}%` : "-"}
                    </td>
                    <td
                      className={cn(
                        "p-2 text-center text-xs font-medium",
                        option.guaranteedHits === 1
                          ? "text-destructive"
                          : option.possibleHits === 1
                            ? "text-warning"
                            : "text-muted-foreground"
                      )}
                    >
                      {option.hitsText || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">상대 포켓몬을 정확히 입력하라.</p>
          )}
          <p className="text-xs text-muted-foreground">
            KO 확률은 16롤 기준. 데미지·선공 판정 모두 상대 노력치 0투자 중립 가정이다. 상대가 스피드·방어에 투자하면 결과가 달라질 수 있다.
          </p>
        </Card>
      )}

      {myParty.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">랭크·상태</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">전투 중인 포켓몬</span>
              <div className="grid grid-cols-5 gap-2">
                {RANK_KEYS.map((key) => (
                  <label key={key} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{RANK_LABELS[key]}</span>
                    <NumberField
                      value={battle.myRanks[key]}
                      min={-6}
                      max={6}
                      onValueChange={(value) => battle.setMyRank(key, value)}
                    />
                  </label>
                ))}
              </div>
              <Field label="상태이상">
                <Select
                  value={battle.myStatus}
                  onValueChange={(value) => battle.setMyStatus(value as StatusCondition | "")}
                  options={[
                    { value: "", label: "없음" },
                    ...STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
                  ]}
                />
              </Field>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">상대</span>
              <div className="grid grid-cols-5 gap-2">
                {RANK_KEYS.map((key) => (
                  <label key={key} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{RANK_LABELS[key]}</span>
                    <NumberField
                      value={battle.opponentRanks[key]}
                      min={-6}
                      max={6}
                      onValueChange={(value) => battle.setOpponentRank(key, value)}
                    />
                  </label>
                ))}
              </div>
              <Field label="상태이상">
                <Select
                  value={battle.opponentStatus}
                  onValueChange={(value) => battle.setOpponentStatus(value as StatusCondition | "")}
                  options={[
                    { value: "", label: "없음" },
                    ...STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
                  ]}
                />
              </Field>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            랭크는 각 능력치 -6~+6. +1 = 1.5배, -1 ≈ 0.67배. 화상이면 물리 공격이 절반.
          </p>
        </Card>
      )}

      {myParty.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">필드</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">내 진입 위험</span>
              <Checkbox
                checked={battle.field.myStealthRock}
                onCheckedChange={(checked) => battle.setField({ myStealthRock: checked })}
                label="스텔스록"
              />
              <Checkbox
                checked={battle.field.myStickyWeb}
                onCheckedChange={(checked) => battle.setField({ myStickyWeb: checked })}
                label="끈적네트"
              />
              <Field label="압정 층수">
                <Select
                  value={String(battle.field.mySpikes)}
                  onValueChange={(value) => battle.setField({ mySpikes: Number(value) as 0 | 1 | 2 | 3 })}
                  options={[
                    { value: "0", label: "없음" },
                    { value: "1", label: "1층" },
                    { value: "2", label: "2층" },
                    { value: "3", label: "3층" },
                  ]}
                />
              </Field>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">상대 스크린</span>
              <Checkbox
                checked={battle.field.opponentLightScreen}
                onCheckedChange={(checked) => battle.setField({ opponentLightScreen: checked })}
                label="빛의장막 (특수 반감)"
              />
              <Checkbox
                checked={battle.field.opponentReflect}
                onCheckedChange={(checked) => battle.setField({ opponentReflect: checked })}
                label="리플렉터 (물리 반감)"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">선공 판정</span>
              <Checkbox
                checked={battle.field.myTailwind}
                onCheckedChange={(checked) => battle.setField({ myTailwind: checked })}
                label="내 순풍"
              />
              <Checkbox
                checked={battle.field.opponentTailwind}
                onCheckedChange={(checked) => battle.setField({ opponentTailwind: checked })}
                label="상대 순풍"
              />
              <Checkbox checked={battle.trickRoom} onCheckedChange={battle.setTrickRoom} label="트릭룸" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            스텔스록·압정은 교체 진입 데미지로 교체 평가에, 스크린은 데미지에, 순풍·트릭룸은 선공 판정에 반영된다.
          </p>
        </Card>
      )}

      {myParty.length > 0 && <AdvisorPanel advice={advice} />}

      {advise.isError && (
        <Card>
          <p className="text-sm text-destructive">
            {advise.error instanceof Error ? advise.error.message : "추천 실패"}
          </p>
        </Card>
      )}
      {advise.data && <AnalysisResult result={advise.data} />}

      <PokemonDatalist />
    </section>
  );
};
