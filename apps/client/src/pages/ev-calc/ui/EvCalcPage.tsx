import { useState } from 'react';

import { cn } from '@/common/lib/cn';
import { PokemonDatalist } from '@/features/pokemon-picker/ui/PokemonDatalist';

import { BulkMode } from './BulkMode';
import { PowerMode } from './PowerMode';
import { SpeedMode } from './SpeedMode';

type Mode = 'bulk' | 'speed' | 'power';

const MODES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'bulk', label: '내구 역산' },
  { value: 'speed', label: '스피드 역산' },
  { value: 'power', label: '화력 역산' },
];

export const EvCalcPage = () => {
  const [mode, setMode] = useState<Mode>('bulk');

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">노력치 역산기</h1>
        <div className="flex gap-1">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setMode(item.value)}
              className={cn(
                'rounded-md px-3 py-1.5',
                'text-sm font-medium',
                mode === item.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
                'transition',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {mode === 'bulk' && <BulkMode />}
      {mode === 'speed' && <SpeedMode />}
      {mode === 'power' && <PowerMode />}

      <PokemonDatalist />
    </section>
  );
};
