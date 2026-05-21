import { type ComponentProps } from "react";

import { cn } from "@/common/lib/cn";

type SelectProps = ComponentProps<"select">;

export const Select = ({ className, children, ...props }: SelectProps) => (
  <select
    className={cn(
      "h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none",
      className
    )}
    {...props}
  >
    {children}
  </select>
);
