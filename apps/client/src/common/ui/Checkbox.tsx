import { Check } from "lucide-react";
import { type ComponentProps, type ReactNode } from "react";

import { cn } from "@/common/lib/cn";

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "onChange"> & {
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
};

export const Checkbox = ({
  className,
  label,
  onCheckedChange,
  ...props
}: CheckboxProps) => (
  <label className={cn("inline-flex cursor-pointer items-center gap-2 select-none", className)}>
    <span className="relative inline-flex items-center justify-center">
      <input
        type="checkbox"
        onChange={(event) => onCheckedChange?.(event.currentTarget.checked)}
        className="peer sr-only"
        {...props}
      />
      <span className="flex size-4 items-center justify-center rounded-sm border border-border bg-input transition peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:opacity-50">
        <Check className="size-3 text-primary-foreground opacity-0 transition peer-checked:opacity-100" />
      </span>
    </span>
    {label && <span className="text-sm text-foreground">{label}</span>}
  </label>
);
