import { findMegasBySpecies } from '@pokedex-agent/pokedex-core';

import { cn } from '@/common/lib/cn';

type MegaControlProps = {
  species: string;
  value: string;
  onChange: (form: string) => void;
  className?: string;
};

// 메가 가능한 종족이면 [비메가 | 메가XX (| Y)] segmented control로 통일한다.
// 메가가 단일이든 X/Y 다중이든 같은 톤이라 시각적 일관성이 유지된다.
export const MegaControl = ({ species, value, onChange, className }: MegaControlProps) => {
  const options = findMegasBySpecies(species);
  if (options.length === 0) {
    return null;
  }
  // 라벨 일관성: 단일 메가는 "메가", X/Y 다중은 "메가X"/"메가Y"로 짧게 통일한다.
  const labelOf = (form: string): string => {
    if (options.length === 1) {
      return '메가';
    }
    if (form.endsWith('-x')) {
      return '메가X';
    }
    if (form.endsWith('-y')) {
      return '메가Y';
    }
    return '메가';
  };
  const cell =
    'flex-1 h-8 px-3 text-xs font-medium whitespace-nowrap transition first:rounded-l-md last:rounded-r-md border-r border-border last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  const selected = 'bg-primary/15 text-foreground';
  const unselected = 'bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground';
  return (
    <div
      className={cn(
        'inline-flex items-stretch',
        'w-full',
        'overflow-hidden rounded-md border',
        'border-border',
        className,
      )}
    >
      <button type="button" onClick={() => onChange('')} className={cn(cell, value === '' ? selected : unselected)}>
        비메가
      </button>
      {options.map((mega) => (
        <button
          key={mega.form}
          type="button"
          onClick={() => onChange(mega.form)}
          className={cn(cell, value === mega.form ? selected : unselected)}
        >
          {labelOf(mega.form)}
        </button>
      ))}
    </div>
  );
};
