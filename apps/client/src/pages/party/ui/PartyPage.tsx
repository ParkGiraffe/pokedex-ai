import { analysis, findMegaByItem } from '@pokedex-agent/pokedex-core';
import { useState } from 'react';

import { cn } from '@/common/lib/cn';
import { Button } from '@/common/ui/Button';
import { Card } from '@/common/ui/Card';
import { useAnalyzeParty } from '@/features/advisor/model/useAnalyzeParty';
import { AnalysisResult } from '@/features/advisor/ui/AnalysisResult';
import { PokemonDatalist } from '@/features/pokemon-picker/ui/PokemonDatalist';
import { PresetManager } from '@/features/presets';

import { buildParty, teamWeakness } from '../lib/party';
import { MAX_PARTY, usePartyStore } from '../model/store';
import { PartyImportPanel } from './PartyImportPanel';
import { PartySlot } from './PartySlot';

export const PartyPage = () => {
  const { members, addMember, removeMember, updateMember, setMembers } = usePartyStore();
  const [importOpen, setImportOpen] = useState(false);
  const analyze = useAnalyzeParty();

  const party = buildParty(members);
  const summary = analysis.analyzeParty(party);
  const roleLine = Object.entries(summary.roles)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => `${name} ${count}`)
    .join(', ');
  const weakness = teamWeakness(members)
    .filter((entry) => entry.weakCount > 0)
    .sort((a, b) => b.weakCount - a.weakCount);

  const megaCarriers = members
    .map((member, index) => ({ member, index, mega: member.item ? findMegaByItem(member.item) : undefined }))
    .filter((entry) => entry.mega !== undefined);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">파티빌더</h1>
        <div className="flex gap-2">
          <Button onClick={() => analyze.mutate(party)} disabled={analyze.isPending}>
            {analyze.isPending ? '분석 중...' : '이 파티 분석'}
          </Button>
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            파티 가져오기
          </Button>
        </div>
      </header>

      <PresetManager currentParty={members} onLoad={(loaded) => setMembers(loaded)} />

      <Card>
        <h2 className="text-foreground mb-2 text-sm font-semibold">파티 약점 (2배 이상으로 받는 멤버 수)</h2>
        {weakness.length === 0 ? (
          <p className="text-muted-foreground text-sm">유효한 포켓몬을 입력하면 약점이 집계된다.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {weakness.map((entry) => (
              <span
                key={entry.type}
                className={cn(
                  'rounded-md border px-2 py-0.5',
                  'text-xs font-medium',
                  entry.weakCount >= 3
                    ? 'bg-destructive/20 text-destructive border-transparent'
                    : entry.weakCount === 2
                      ? 'bg-warning/20 text-warning border-transparent'
                      : 'border-border bg-muted text-muted-foreground',
                )}
              >
                {entry.type} {entry.weakCount}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-1.5 text-sm">
        <h2 className="text-foreground text-sm font-semibold">분석 요약</h2>
        <p className="text-foreground">
          약점 분산 <span className="text-primary font-semibold">{summary.synergy.dispersionScore}/100</span> (피크{' '}
          {summary.synergy.sharedWeaknessPeak}슬롯)
        </p>
        <p className="text-muted-foreground">역할 분포: {roleLine || '없음'}</p>
        <p className="text-muted-foreground">
          화력 합계: 물리 {summary.balance.physicalPower} · 특수 {summary.balance.specialPower} · 내구{' '}
          {summary.balance.bulk}
        </p>
        {megaCarriers.length >= 2 && (
          <p className="text-warning flex items-center gap-1.5 text-xs">
            <span className="bg-warning/15 rounded-md px-2 py-0.5 font-semibold">메가 {megaCarriers.length}개</span>
            <span className="text-muted-foreground">1마리만 사용 가능 · "이 파티 분석"으로 대체 도구 확인</span>
          </p>
        )}
        {megaCarriers.length === 1 && (
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span className="bg-muted rounded-md px-2 py-0.5">메가 {megaCarriers[0]!.member.species}</span>
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
          <p className="text-destructive text-sm">
            {analyze.error instanceof Error ? analyze.error.message : '분석 실패'}
          </p>
        </Card>
      )}
      {analyze.data && <AnalysisResult result={analyze.data} />}

      <PokemonDatalist />
      <PartyImportPanel open={importOpen} onClose={() => setImportOpen(false)} />
    </section>
  );
};
