import { useNavigate, useSearch } from '@tanstack/react-router';
import { Swords } from 'lucide-react';

import { cn } from '@/common/lib/cn';

import { LeadTab } from './LeadTab';
import { MatrixTab } from './MatrixTab';

type Tab = 'lead' | 'matrix';

const TABS: ReadonlyArray<{ value: Tab; label: string }> = [
  { value: 'lead', label: '선출 추천' },
  { value: 'matrix', label: '상성표' },
];

export const MatchupPage = () => {
  const { tab } = useSearch({ from: '/matchup' });
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-5">
      <header className="border-border flex flex-wrap items-center gap-3 border-b pb-3">
        <Swords className="text-primary size-6" />
        <h1 className="text-2xl font-bold tracking-tight">선출</h1>
        <div className="ml-auto flex gap-1">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => void navigate({ to: '/matchup', search: { tab: item.value } })}
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

      {tab === 'lead' && <LeadTab />}
      {tab === 'matrix' && <MatrixTab />}
    </section>
  );
};
