import { useState } from 'react';

import { cn } from '@/common/lib/cn';
import { PokemonDatalist } from '@/features/pokemon-picker';

import { BulkMode } from './BulkMode';
import { EvSpeedMode } from './EvSpeedMode';
import { PowerMode } from './PowerMode';

type Mode = 'bulk' | 'speed' | 'power';

const MODES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'bulk', label: '내구 역산' },
  { value: 'speed', label: '스피드 역산' },
  { value: 'power', label: '화력 역산' },
];

export const EvCalcTab = () => {
  const [mode, setMode] = useState<Mode>('bulk');

  return (
    <>
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

      {mode === 'bulk' && <BulkMode />}
      {mode === 'speed' && <EvSpeedMode />}
      {mode === 'power' && <PowerMode />}

      <PokemonDatalist />
    </>
  );
};
