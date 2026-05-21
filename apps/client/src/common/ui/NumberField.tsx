import { cn } from "@/common/lib/cn";

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
      const next = Number(event.currentTarget.value);
      onValueChange(Number.isNaN(next) ? 0 : next);
    }}
    className={cn(
      "h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none",
      className
    )}
  />
);
