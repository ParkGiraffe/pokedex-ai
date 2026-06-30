import { useNavigate, useSearch } from '@tanstack/react-router';

import { cn } from '@/common/lib/cn';
import { Card } from '@/common/ui/Card';
import { useBattleAdvice } from '@/features/advisor';
import { AnalysisResult } from '@/features/advisor';
import { PokemonDatalist } from '@/features/pokemon-picker';
import { buildParty } from '@/pages/party/lib/party';
import { usePartyStore } from '@/pages/party/model/store';

import { activeMegaOptions, battleAdvice, battleOptions, buildBattleState, opponentMegaOptions } from '../lib/battle';
import { useBattleStore } from '../model/store';
import { ActiveVsCard } from './ActiveVsCard';
import { AdvisorPanel } from './AdvisorPanel';
import { BattleHeader } from './BattleHeader';
import { BattleSetupCard } from './BattleSetupCard';
import { FieldCard } from './FieldCard';
import { RankStatusCard } from './RankStatusCard';
import { RosterCard } from './RosterCard';
import { ScreenshotTab } from './ScreenshotTab';

type Tab = 'manual' | 'screenshot';

const TABS: ReadonlyArray<{ value: Tab; label: string }> = [
  { value: 'manual', label: '직접 입력' },
  { value: 'screenshot', label: '스크린샷' },
];

const ManualTab = () => {
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

  const effectiveRoster =
    battle.rosterSpecies.length > 0 ? battle.rosterSpecies : myParty.map((member) => member.species);
  const handleToggleRoster = (species: string) => {
    const next = effectiveRoster.includes(species)
      ? effectiveRoster.filter((value) => value !== species)
      : [...effectiveRoster, species];
    battle.setRosterSpecies(next);
  };

  return (
    <>
      <BattleHeader state={state} advise={advise} />

      <BattleSetupCard
        turn={battle.turn}
        weather={battle.weather}
        opponentSpecies={battle.opponentSpecies}
        onTurnChange={battle.setTurn}
        onWeatherChange={battle.setWeather}
        onOpponentSpeciesChange={battle.setOpponentSpecies}
      />

      {myParty.length > 0 && (
        <RosterCard myParty={myParty} effectiveRoster={effectiveRoster} onToggleRoster={handleToggleRoster} />
      )}

      {myParty.length === 0 ? (
        <Card>
          <p className="text-muted-foreground text-sm">파티빌더에서 내 파티를 먼저 입력하라.</p>
        </Card>
      ) : (
        <ActiveVsCard
          myParty={myParty}
          activeIndex={activeIndex}
          effectiveRoster={effectiveRoster}
          opponentSpecies={battle.opponentSpecies}
          opponentHpPercent={battle.opponentHpPercent}
          myMegaForm={battle.myMegaForm}
          opponentMegaForm={battle.opponentMegaForm}
          myMegas={myMegas}
          opponentMegas={opponentMegas}
          options={options}
          advice={advice}
          onActiveIndexChange={battle.setMyActiveIndex}
          onOpponentHpPercentChange={battle.setOpponentHpPercent}
          onMyMegaFormChange={battle.setMyMegaForm}
          onOpponentMegaFormChange={battle.setOpponentMegaForm}
        />
      )}

      {myParty.length > 0 && (
        <RankStatusCard
          myRanks={battle.myRanks}
          opponentRanks={battle.opponentRanks}
          myStatus={battle.myStatus}
          opponentStatus={battle.opponentStatus}
          onMyRankChange={battle.setMyRank}
          onOpponentRankChange={battle.setOpponentRank}
          onMyStatusChange={battle.setMyStatus}
          onOpponentStatusChange={battle.setOpponentStatus}
        />
      )}

      {myParty.length > 0 && (
        <FieldCard
          field={battle.field}
          trickRoom={battle.trickRoom}
          onFieldChange={battle.setField}
          onTrickRoomChange={battle.setTrickRoom}
        />
      )}

      {myParty.length > 0 && <AdvisorPanel advice={advice} />}

      {advise.isError && (
        <Card>
          <p className="text-destructive text-sm">
            {advise.error instanceof Error ? advise.error.message : '추천 실패'}
          </p>
        </Card>
      )}
      {advise.isSuccess && <AnalysisResult result={advise.data} />}

      <PokemonDatalist />
    </>
  );
};

export const BattlePage = () => {
  const { tab } = useSearch({ from: '/battle' });
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">배틀</h1>
        <div className="flex gap-1">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => void navigate({ to: '/battle', search: { tab: item.value } })}
              className={cn(
                'rounded-md px-3 py-1.5',
                'text-sm font-medium',
                tab === item.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
                'transition',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'manual' && <ManualTab />}
      {tab === 'screenshot' && <ScreenshotTab />}
    </section>
  );
};
