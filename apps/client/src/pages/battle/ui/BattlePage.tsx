import { type Weather } from "@pokedex-agent/pokedex-core";
import { useState } from "react";

import { cn } from "@/common/lib/cn";
import { Button } from "@/common/ui/Button";
import { Card } from "@/common/ui/Card";
import { Field } from "@/common/ui/Field";
import { NumberField } from "@/common/ui/NumberField";
import { Select } from "@/common/ui/Select";
import { ExportButton } from "@/features/claude-bridge/ui/ExportButton";
import { PasteSidePanel } from "@/features/claude-bridge/ui/PasteSidePanel";
import { PokemonDatalist } from "@/features/pokemon-picker/ui/PokemonDatalist";
import { PokemonPicker } from "@/features/pokemon-picker/ui/PokemonPicker";
import { buildParty } from "@/pages/party/lib/party";
import { usePartyStore } from "@/pages/party/model/store";

import { battleOptions, buildBattleState } from "../lib/battle";
import { useBattleStore } from "../model/store";

const WEATHERS: Weather[] = ["맑음", "비", "모래바람", "눈"];

export const BattlePage = () => {
  const members = usePartyStore((state) => state.members);
  const battle = useBattleStore();
  const [panelOpen, setPanelOpen] = useState(false);

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
  };
  const options = battleOptions(input);
  const state = buildBattleState(input);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">배틀</h1>
        <div className="flex gap-2">
          {state && <ExportButton task="battle-decision" payload={{ state }} label="지금 뭐 할까?" />}
          <Button variant="ghost" onClick={() => setPanelOpen(true)}>
            Claude 답변 붙여넣기
          </Button>
        </div>
      </header>

      <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="턴">
          <NumberField value={battle.turn} min={1} onValueChange={battle.setTurn} />
        </Field>
        <Field label="날씨">
          <Select value={battle.weather} onChange={(event) => battle.setWeather(event.currentTarget.value as Weather | "")}>
            <option value="">없음</option>
            {WEATHERS.map((weather) => (
              <option key={weather} value={weather}>
                {weather}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="상대 종족">
          <PokemonPicker value={battle.opponentSpecies} onSelect={(name) => battle.setOpponentSpecies(name)} />
        </Field>
        <Field label="상대 HP %">
          <NumberField
            value={battle.opponentHpPercent}
            min={1}
            max={100}
            onValueChange={battle.setOpponentHpPercent}
          />
        </Field>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={battle.trickRoom} onChange={(event) => battle.setTrickRoom(event.currentTarget.checked)} />
          트릭룸
        </label>
      </Card>

      {myParty.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-400">파티빌더에서 내 파티를 먼저 입력하라.</p>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3">
          <Field label="내 액티브">
            <Select
              value={activeIndex}
              onChange={(event) => battle.setMyActiveIndex(Number(event.currentTarget.value))}
            >
              {myParty.map((member, index) => (
                <option key={`${member.species}-${index}`} value={index}>
                  {member.species}
                </option>
              ))}
            </Select>
          </Field>

          {options ? (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-xs text-neutral-500">
                  <th className="p-1 text-left">기술</th>
                  <th className="p-1">타입</th>
                  <th className="p-1">데미지</th>
                  <th className="p-1">KO 확률</th>
                </tr>
              </thead>
              <tbody>
                {options.map((option) => (
                  <tr key={option.move} className="border-t border-neutral-800">
                    <td className="p-1 font-medium text-neutral-200">{option.move}</td>
                    <td className="p-1 text-center text-neutral-400">{option.type}</td>
                    <td className="p-1 text-center text-neutral-300">
                      {option.damaging ? `${option.min}~${option.max}` : "변화기"}
                    </td>
                    <td
                      className={cn(
                        "p-1 text-center font-medium",
                        option.koChance >= 1
                          ? "text-rose-400"
                          : option.koChance > 0
                            ? "text-amber-400"
                            : "text-neutral-500"
                      )}
                    >
                      {option.damaging ? `${Math.round(option.koChance * 100)}%` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-neutral-400">상대 종족을 정확히 입력하라.</p>
          )}
          <p className="text-xs text-neutral-500">KO 확률은 16롤 기준, 상대 0투자 중립 가정이다.</p>
        </Card>
      )}

      <PokemonDatalist />
      <PasteSidePanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </section>
  );
};
