import { analysis, NATURE_NAMES, TYPE_NAMES } from "@pokedex-agent/pokedex-core";
import { useState } from "react";

import { cn } from "@/common/lib/cn";
import { Button } from "@/common/ui/Button";
import { Card } from "@/common/ui/Card";
import { Field } from "@/common/ui/Field";
import { Input } from "@/common/ui/Input";
import { NumberField } from "@/common/ui/NumberField";
import { Select } from "@/common/ui/Select";
import { useAnalyzeParty } from "@/features/advisor/model/useAnalyzeParty";
import { AnalysisResult } from "@/features/advisor/ui/AnalysisResult";
import { PokemonDatalist } from "@/features/pokemon-picker/ui/PokemonDatalist";
import { PokemonIcon } from "@/features/pokemon-picker/ui/PokemonIcon";
import { PokemonPicker } from "@/features/pokemon-picker/ui/PokemonPicker";

import { buildParty, memberError, teamWeakness } from "../lib/party";
import { MAX_PARTY, type MemberDraft, usePartyStore } from "../model/store";
import { PartyImportPanel } from "./PartyImportPanel";

const TERA_OPTIONS = [...TYPE_NAMES, "스텔라"] as const;
const EV_KEYS: Array<keyof MemberDraft["evs"]> = ["H", "A", "B", "C", "D", "S"];

type SlotProps = {
  index: number;
  draft: MemberDraft;
  onChange: (patch: Partial<MemberDraft>) => void;
  onRemove: () => void;
};

const PartySlot = ({ index, draft, onChange, onRemove }: SlotProps) => {
  const error = memberError(draft);
  const evSum = EV_KEYS.reduce((total, key) => total + draft.evs[key], 0);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-neutral-300">
          슬롯 {index + 1}
          <PokemonIcon species={draft.species} className="h-9 w-9" />
        </span>
        <button type="button" onClick={onRemove} className="text-xs text-neutral-500 hover:text-rose-400">
          삭제
        </button>
      </div>

      <Field label="종족">
        <PokemonPicker value={draft.species} invalid={Boolean(error)} onSelect={(name) => onChange({ species: name })} />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="특성">
          <Input value={draft.ability} onChange={(event) => onChange({ ability: event.currentTarget.value })} />
        </Field>
        <Field label="도구">
          <Input value={draft.item} onChange={(event) => onChange({ item: event.currentTarget.value })} />
        </Field>
        <Field label="성격">
          <Select value={draft.nature} onChange={(event) => onChange({ nature: event.currentTarget.value as (typeof NATURE_NAMES)[number] })}>
            {NATURE_NAMES.map((nature) => (
              <option key={nature} value={nature}>
                {nature}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="테라">
          <Select value={draft.teraType} onChange={(event) => onChange({ teraType: event.currentTarget.value as (typeof TERA_OPTIONS)[number] })}>
            {TERA_OPTIONS.map((tera) => (
              <option key={tera} value={tera}>
                {tera}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {draft.moves.map((move, moveIndex) => (
          <Input
            key={moveIndex}
            value={move}
            placeholder={`기술 ${moveIndex + 1}`}
            onChange={(event) => {
              const moves = [...draft.moves] as MemberDraft["moves"];
              moves[moveIndex] = event.currentTarget.value;
              onChange({ moves });
            }}
          />
        ))}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-neutral-400">
          <span>노력치</span>
          <span>합계 {evSum}</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {EV_KEYS.map((key) => (
            <label key={key} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-neutral-500">{key}</span>
              <NumberField
                value={draft.evs[key]}
                min={0}
                max={252}
                step={4}
                onValueChange={(value) => onChange({ evs: { ...draft.evs, [key]: value } })}
                className="px-1 text-center"
              />
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </Card>
  );
};

export const PartyPage = () => {
  const { members, addMember, removeMember, updateMember } = usePartyStore();
  const [importOpen, setImportOpen] = useState(false);
  const analyze = useAnalyzeParty();

  const party = buildParty(members);
  const summary = analysis.analyzeParty(party);
  const roleLine = Object.entries(summary.roles)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => `${name} ${count}`)
    .join(", ");
  const weakness = teamWeakness(members)
    .filter((entry) => entry.weakCount > 0)
    .sort((a, b) => b.weakCount - a.weakCount);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">파티빌더</h1>
        <div className="flex gap-2">
          <Button onClick={() => analyze.mutate(party)} disabled={analyze.isPending}>
            {analyze.isPending ? "분석 중..." : "이 파티 분석"}
          </Button>
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            파티 가져오기
          </Button>
        </div>
      </header>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-neutral-300">파티 약점 (2배 이상으로 받는 멤버 수)</h2>
        {weakness.length === 0 ? (
          <p className="text-sm text-neutral-500">유효한 종족을 입력하면 약점이 집계된다.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {weakness.map((entry) => (
              <span
                key={entry.type}
                className={cn(
                  "rounded px-2 py-0.5 text-xs",
                  entry.weakCount >= 3 ? "bg-rose-700 text-rose-100" : "bg-rose-900 text-rose-300"
                )}
              >
                {entry.type} {entry.weakCount}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-1.5 text-sm">
        <h2 className="text-sm font-semibold text-neutral-300">분석 요약</h2>
        <p className="text-neutral-300">
          약점 분산 <span className="font-semibold text-emerald-400">{summary.synergy.dispersionScore}/100</span>
          {" "}(피크 {summary.synergy.sharedWeaknessPeak}슬롯)
        </p>
        <p className="text-neutral-400">역할 분포: {roleLine || "없음"}</p>
        <p className="text-neutral-400">
          화력 합계: 물리 {summary.balance.physicalPower} · 특수 {summary.balance.specialPower} · 내구{" "}
          {summary.balance.bulk}
        </p>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {members.map((member, index) => (
          <PartySlot
            key={index}
            index={index}
            draft={member}
            onChange={(patch) => updateMember(index, patch)}
            onRemove={() => removeMember(index)}
          />
        ))}
      </div>

      {members.length < MAX_PARTY && (
        <Button variant="secondary" className="w-fit" onClick={addMember}>
          슬롯 추가
        </Button>
      )}

      {analyze.isError && (
        <Card>
          <p className="text-sm text-rose-400">
            {analyze.error instanceof Error ? analyze.error.message : "분석 실패"}
          </p>
        </Card>
      )}
      {analyze.data && <AnalysisResult result={analyze.data} />}

      <PokemonDatalist />
      <PartyImportPanel open={importOpen} onClose={() => setImportOpen(false)} />
    </section>
  );
};
