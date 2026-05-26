import { NATURE_NAMES, TYPE_NAMES } from "@pokedex-agent/pokedex-core";

import { cn } from "@/common/lib/cn";
import { Card } from "@/common/ui/Card";
import { Field } from "@/common/ui/Field";
import { NumberField } from "@/common/ui/NumberField";
import { Select } from "@/common/ui/Select";
import { PokemonDatalist } from "@/features/pokemon-picker/ui/PokemonDatalist";
import { PokemonIcon } from "@/features/pokemon-picker/ui/PokemonIcon";
import { PokemonPicker } from "@/features/pokemon-picker/ui/PokemonPicker";

import { computeCalc } from "../lib/calc";
import { useCalculatorStore } from "../model/store";

const ITEM_OPTIONS = [
  { value: 1, label: "없음" },
  { value: 1.2, label: "안경/구애머리띠 등 1.2배" },
  { value: 1.3, label: "생명의구슬 1.3배" },
  { value: 1.5, label: "구애 1.5배" },
] as const;

const WEATHER_OPTIONS = [
  { value: 1, label: "없음" },
  { value: 1.5, label: "강화 1.5배" },
  { value: 0.5, label: "약화 0.5배" },
] as const;

const RollBar = ({ rolls, max }: { rolls: number[]; max: number }) => (
  <div className="flex h-20 items-end gap-0.5">
    {rolls.map((roll, index) => (
      <div
        key={index}
        className="flex-1 rounded-t bg-emerald-500/80"
        style={{ height: `${max > 0 ? (roll / max) * 100 : 0}%` }}
        title={String(roll)}
      />
    ))}
  </div>
);

export const CalculatorPage = () => {
  const { attacker, defender, setAttacker, setDefender } = useCalculatorStore();
  const result = computeCalc(attacker, defender);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">계산기</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-emerald-400">공격 (누오)</h2>
          <Field label="종족">
            <div className="flex items-center gap-2">
              <PokemonIcon species={attacker.species} />
              <PokemonPicker
                value={attacker.species}
                invalid={!result}
                onSelect={(name) => setAttacker({ species: name })}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="분류">
              <Select
                value={attacker.category}
                onChange={(event) =>
                  setAttacker({ category: event.currentTarget.value as "물리" | "특수" })
                }
              >
                <option value="물리">물리</option>
                <option value="특수">특수</option>
              </Select>
            </Field>
            <Field label="기술 타입">
              <Select
                value={attacker.moveType}
                onChange={(event) =>
                  setAttacker({ moveType: event.currentTarget.value as (typeof TYPE_NAMES)[number] })
                }
              >
                {TYPE_NAMES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="위력">
              <NumberField
                value={attacker.movePower}
                min={0}
                max={250}
                onValueChange={(value) => setAttacker({ movePower: value })}
              />
            </Field>
            <Field label="공격 노력치">
              <NumberField
                value={attacker.ev}
                min={0}
                max={252}
                step={4}
                onValueChange={(value) => setAttacker({ ev: value })}
              />
            </Field>
            <Field label="성격">
              <Select
                value={attacker.nature}
                onChange={(event) =>
                  setAttacker({ nature: event.currentTarget.value as (typeof NATURE_NAMES)[number] })
                }
              >
                {NATURE_NAMES.map((nature) => (
                  <option key={nature} value={nature}>
                    {nature}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="공격 랭크">
              <NumberField
                value={attacker.rank}
                min={-6}
                max={6}
                onValueChange={(value) => setAttacker({ rank: value })}
              />
            </Field>
            <Field label="도구">
              <Select
                value={attacker.itemMultiplier}
                onChange={(event) =>
                  setAttacker({ itemMultiplier: Number(event.currentTarget.value) })
                }
              >
                {ITEM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="날씨">
              <Select
                value={attacker.weatherBoost}
                onChange={(event) =>
                  setAttacker({ weatherBoost: Number(event.currentTarget.value) as 1 | 1.5 | 0.5 })
                }
              >
                {WEATHER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={attacker.terastalized}
                onChange={(event) => setAttacker({ terastalized: event.currentTarget.checked })}
              />
              테라스탈
            </label>
            {attacker.terastalized && (
              <Select
                className="w-auto"
                value={attacker.teraType}
                onChange={(event) =>
                  setAttacker({ teraType: event.currentTarget.value as typeof attacker.teraType })
                }
              >
                {[...TYPE_NAMES, "스텔라"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            )}
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={attacker.critical}
                onChange={(event) => setAttacker({ critical: event.currentTarget.checked })}
              />
              급소
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={attacker.burned}
                onChange={(event) => setAttacker({ burned: event.currentTarget.checked })}
              />
              화상
            </label>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-sky-400">방어 (토오)</h2>
          <Field label="종족">
            <div className="flex items-center gap-2">
              <PokemonIcon species={defender.species} />
              <PokemonPicker
                value={defender.species}
                invalid={!result}
                onSelect={(name) => setDefender({ species: name })}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="HP 노력치">
              <NumberField
                value={defender.hpEv}
                min={0}
                max={252}
                step={4}
                onValueChange={(value) => setDefender({ hpEv: value })}
              />
            </Field>
            <Field label="방어 노력치">
              <NumberField
                value={defender.defEv}
                min={0}
                max={252}
                step={4}
                onValueChange={(value) => setDefender({ defEv: value })}
              />
            </Field>
            <Field label="성격">
              <Select
                value={defender.nature}
                onChange={(event) =>
                  setDefender({ nature: event.currentTarget.value as (typeof NATURE_NAMES)[number] })
                }
              >
                {NATURE_NAMES.map((nature) => (
                  <option key={nature} value={nature}>
                    {nature}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="방어 랭크">
              <NumberField
                value={defender.rank}
                min={-6}
                max={6}
                onValueChange={(value) => setDefender({ rank: value })}
              />
            </Field>
          </div>
        </Card>
      </div>

      <Card>
        {result ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="text-2xl font-bold text-emerald-400">
                {result.minPercent.toFixed(1)}% ~ {result.maxPercent.toFixed(1)}%
              </span>
              <span className="text-sm text-neutral-400">
                데미지 {result.damage.min} ~ {result.damage.max} / HP {result.defenderHp}
              </span>
              <span className="text-sm text-neutral-400">상성 {result.damage.effectiveness}배</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  result.maxPercent >= 100 ? "text-rose-400" : "text-neutral-300"
                )}
              >
                {Number.isFinite(result.guaranteedHits)
                  ? `확정 ${result.guaranteedHits}타`
                  : "데미지 없음"}
              </span>
            </div>
            <RollBar rolls={result.damage.rolls} max={result.damage.max} />
          </div>
        ) : (
          <p className="text-sm text-neutral-400">공격·방어 종족을 정확히 입력하라.</p>
        )}
      </Card>

      <PokemonDatalist />
    </section>
  );
};
