import { analysis, findMegaByItem, NATURE_NAMES, TYPE_NAMES } from "@pokedex-agent/pokedex-core";
import { useState } from "react";

import { cn } from "@/common/lib/cn";
import { STAT_LABEL_KO } from "@/common/lib/stat";
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
import { PresetManager } from "@/features/presets";

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
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          슬롯 {index + 1}
          <PokemonIcon species={draft.species} className="h-9 w-9" />
        </span>
        <button type="button" onClick={onRemove} className="text-xs text-muted-foreground hover:text-destructive">
          삭제
        </button>
      </div>

      <Field label="포켓몬">
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
          <Select
            value={draft.nature}
            onValueChange={(value) => onChange({ nature: value as (typeof NATURE_NAMES)[number] })}
            options={NATURE_NAMES.map((nature) => ({ value: nature, label: nature }))}
          />
        </Field>
        <Field label="테라">
          <Select
            value={draft.teraType}
            onValueChange={(value) => onChange({ teraType: value as (typeof TERA_OPTIONS)[number] })}
            options={TERA_OPTIONS.map((tera) => ({ value: tera, label: tera }))}
          />
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
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>노력치</span>
          <span>합계 {evSum}</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {EV_KEYS.map((key) => (
            <label key={key} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-muted-foreground">{STAT_LABEL_KO[key]}</span>
              <NumberField
                value={draft.evs[key]}
                min={0}
                max={32}
                step={1}
                onValueChange={(point) => onChange({ evs: { ...draft.evs, [key]: point } })}
                className="px-1 text-center"
              />
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </Card>
  );
};

export const PartyPage = () => {
  const { members, addMember, removeMember, updateMember, setMembers } = usePartyStore();
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

  // 챔피언스는 한 배틀에 메가진화가 1마리만 가능. 메가스톤 보유 슬롯이 2개 이상이면 잉여.
  const megaCarriers = members
    .map((member, index) => ({ member, index, mega: member.item ? findMegaByItem(member.item) : undefined }))
    .filter((entry) => entry.mega !== undefined);

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

      <PresetManager currentParty={members} onLoad={(loaded) => setMembers(loaded)} />

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-foreground">파티 약점 (2배 이상으로 받는 멤버 수)</h2>
        {weakness.length === 0 ? (
          <p className="text-sm text-muted-foreground">유효한 포켓몬을 입력하면 약점이 집계된다.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {weakness.map((entry) => (
              <span
                key={entry.type}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-medium",
                  entry.weakCount >= 3
                    ? "border-transparent bg-destructive/20 text-destructive"
                    : entry.weakCount === 2
                      ? "border-transparent bg-warning/20 text-warning"
                      : "border-border bg-muted text-muted-foreground"
                )}
              >
                {entry.type} {entry.weakCount}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-1.5 text-sm">
        <h2 className="text-sm font-semibold text-foreground">분석 요약</h2>
        <p className="text-foreground">
          약점 분산 <span className="font-semibold text-primary">{summary.synergy.dispersionScore}/100</span>
          {" "}(피크 {summary.synergy.sharedWeaknessPeak}슬롯)
        </p>
        <p className="text-muted-foreground">역할 분포: {roleLine || "없음"}</p>
        <p className="text-muted-foreground">
          화력 합계: 물리 {summary.balance.physicalPower} · 특수 {summary.balance.specialPower} · 내구{" "}
          {summary.balance.bulk}
        </p>
        {megaCarriers.length >= 2 && (
          <p className="flex items-center gap-1.5 text-xs text-warning">
            <span className="rounded-md bg-warning/15 px-2 py-0.5 font-semibold">메가 {megaCarriers.length}개</span>
            <span className="text-muted-foreground">1마리만 사용 가능 · "이 파티 분석"으로 대체 도구 확인</span>
          </p>
        )}
        {megaCarriers.length === 1 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded-md bg-muted px-2 py-0.5">메가 {megaCarriers[0]!.member.species}</span>
          </p>
        )}
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
          <p className="text-sm text-destructive">
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
