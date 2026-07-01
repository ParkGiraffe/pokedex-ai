import { type MegaForm, type Party, speciesDisplayName } from '@pokedex-agent/pokedex-core';
import { type decision } from '@pokedex-agent/pokedex-core';

import { cn } from '@/common/lib/cn';
import { Card } from '@/common/ui/Card';
import { Field } from '@/common/ui/Field';
import { HpBar } from '@/common/ui/HpBar';
import { NumberField } from '@/common/ui/NumberField';
import { Select } from '@/common/ui/Select';
import { MegaControl } from '@/features/pokemon-picker';
import { PokemonIcon } from '@/features/pokemon-picker';

import { type BattleAdvice } from '../lib/battle';

type ActiveVsCardProps = {
  myParty: Party;
  activeIndex: number;
  effectiveRoster: string[];
  opponentSpecies: string;
  opponentHpPercent: number;
  myMegaForm: string;
  opponentMegaForm: string;
  myMegas: MegaForm[];
  opponentMegas: MegaForm[];
  options: decision.MoveOption[] | undefined;
  advice: BattleAdvice | undefined;
  onActiveIndexChange: (index: number) => void;
  onOpponentHpPercentChange: (value: number) => void;
  onMyMegaFormChange: (form: string) => void;
  onOpponentMegaFormChange: (form: string) => void;
};

export const ActiveVsCard = ({
  myParty,
  activeIndex,
  effectiveRoster,
  opponentSpecies,
  opponentHpPercent,
  myMegaForm,
  opponentMegaForm,
  myMegas,
  opponentMegas,
  options,
  advice,
  onActiveIndexChange,
  onOpponentHpPercentChange,
  onMyMegaFormChange,
  onOpponentMegaFormChange,
}: ActiveVsCardProps) => (
  <Card className="flex flex-col gap-4">
    <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-4">
      <div className="flex flex-col items-center gap-3 px-2">
        <Field label="전투 중인 포켓몬" className="w-full">
          <Select
            value={String(activeIndex)}
            onValueChange={(value) => onActiveIndexChange(Number(value))}
            options={myParty
              .map((member, index) => ({ member, index }))
              .filter(({ member }) => effectiveRoster.includes(member.species))
              .map(({ member, index }) => ({ value: String(index), label: member.species }))}
          />
        </Field>
        <PokemonIcon species={myParty[activeIndex]?.species ?? ''} className="h-20 w-20" />
        <span className="text-foreground text-base font-semibold">
          {speciesDisplayName(myParty[activeIndex]?.species ?? '', myMegaForm)}
        </span>
        {myMegas.length > 0 && myParty[activeIndex] && (
          <MegaControl species={myParty[activeIndex].species} value={myMegaForm} onChange={onMyMegaFormChange} />
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-2 px-1">
        <span className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">vs</span>
        {advice && (
          <span
            className={cn(
              'rounded-md px-2 py-0.5',
              'text-xs font-medium whitespace-nowrap',
              advice.firstMove === '선공'
                ? 'bg-success/15 text-success'
                : advice.firstMove === '후공'
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {advice.firstMove === '동속' ? '동속 (50%)' : `내 ${advice.firstMove}`}
          </span>
        )}
        <div className="bg-border h-full w-px" />
      </div>

      <div className="flex flex-col items-center gap-3 px-2">
        <Field label="상대 HP %" className="w-full">
          <NumberField value={opponentHpPercent} min={1} max={100} onValueChange={onOpponentHpPercentChange} />
        </Field>
        <PokemonIcon species={opponentSpecies} className="h-20 w-20" />
        <span className="text-foreground text-base font-semibold">
          {opponentSpecies ? speciesDisplayName(opponentSpecies, opponentMegaForm) : '?'}
        </span>
        {opponentMegas.length > 0 && (
          <MegaControl species={opponentSpecies} value={opponentMegaForm} onChange={onOpponentMegaFormChange} />
        )}
        <HpBar percent={opponentHpPercent} className="w-full" />
      </div>
    </div>

    {options ? (
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-border text-muted-foreground border-b text-xs">
            <th className="p-2 text-left font-medium">기술</th>
            <th className="p-2 font-medium">타입</th>
            <th className="p-2 font-medium">데미지</th>
            <th className="p-2 font-medium">KO 확률</th>
            <th className="p-2 font-medium">타수</th>
          </tr>
        </thead>
        <tbody>
          {options.map((option) => (
            <tr key={option.move} className="border-border/40 hover:bg-muted/40 border-b last:border-b-0">
              <td className="text-foreground p-2 font-medium">{option.move}</td>
              <td className="text-muted-foreground p-2 text-center">{option.type}</td>
              <td className="text-foreground p-2 text-center">
                {option.damaging ? `${option.min}~${option.max}` : '변화기'}
              </td>
              <td
                className={cn(
                  'p-2',
                  'text-center font-semibold',
                  option.koChance >= 1
                    ? 'text-destructive'
                    : option.koChance > 0
                      ? 'text-warning'
                      : 'text-muted-foreground',
                )}
              >
                {option.damaging ? `${Math.round(option.koChance * 100)}%` : '-'}
              </td>
              <td
                className={cn(
                  'p-2',
                  'text-center text-xs font-medium',
                  option.guaranteedHits === 1
                    ? 'text-destructive'
                    : option.possibleHits === 1
                      ? 'text-warning'
                      : 'text-muted-foreground',
                )}
              >
                {option.hitsText || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="text-muted-foreground text-sm">상대 포켓몬을 정확히 입력하라.</p>
    )}
    <p className="text-muted-foreground text-xs">
      KO 확률은 16롤 기준. 데미지·선공 판정 모두 상대 노력치 0투자 중립 가정이다. 상대가 스피드·방어에 투자하면 결과가
      달라질 수 있다.
    </p>
  </Card>
);
