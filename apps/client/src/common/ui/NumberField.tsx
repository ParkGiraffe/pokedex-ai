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
      "h-9 w-full rounded-md border border-border bg-input px-2 text-center text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring",
      "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
      className
    )}
  />
);
