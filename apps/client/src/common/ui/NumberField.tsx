import { cn } from '@/common/lib/cn';

type NumberFieldProps = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

export const NumberField = ({ value, onValueChange, min, max, step, className }: NumberFieldProps) => (
  <input
    type="number"
    value={value}
    min={min}
    max={max}
    step={step}
    onChange={(event) => {
      const raw = event.currentTarget.value;
      const next = Number.isNaN(Number(raw)) ? 0 : Number(raw);
      if (raw !== '' && raw !== String(next)) {
        event.currentTarget.value = String(next);
      }
      onValueChange(next);
    }}
    className={cn(
      'h-9 w-full rounded-md border px-2',
      'border-border bg-input text-foreground text-center text-sm',
      '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
      'transition',
      'focus:border-primary focus:ring-ring focus:ring-2 focus:outline-none',
      '[appearance:textfield]',
      className,
    )}
  />
);
