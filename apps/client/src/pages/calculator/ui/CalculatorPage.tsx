import { useNavigate, useSearch } from '@tanstack/react-router';

import { cn } from '@/common/lib/cn';

import { DamageTab } from './DamageTab';
import { EvCalcTab } from './EvCalcTab';
import { SpeedTab } from './SpeedTab';

type Tab = 'damage' | 'speed' | 'ev';

const TABS: ReadonlyArray<{ value: Tab; label: string }> = [
  { value: 'damage', label: '데미지' },
  { value: 'speed', label: '스피드' },
  { value: 'ev', label: '노력치 역산' },
];

export const CalculatorPage = () => {
  const { tab = 'damage' } = useSearch({ from: '/' });
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">계산기</h1>
        <div className="flex gap-1">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => void navigate({ to: '/', search: { tab: item.value } })}
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

      {tab === 'damage' && <DamageTab />}
      {tab === 'speed' && <SpeedTab />}
      {tab === 'ev' && <EvCalcTab />}
    </section>
  );
};
