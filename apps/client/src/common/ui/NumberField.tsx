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
      // type=number는 숫자값이 같으면 문자열을 안 고쳐 "034" 같은 선행 0이 박힌다. 즉시 정규화.
      if (raw !== '' && raw !== String(next)) {
        event.currentTarget.value = String(next);
      }
      onValueChange(next);
    }}
    className={cn(
      'border-border bg-input text-foreground focus:border-primary focus:ring-ring h-9 w-full rounded-md border px-2 text-center text-sm transition focus:ring-2 focus:outline-none',
      '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
      className,
    )}
  />
);
