import { type ComponentProps } from "react";

import { cn } from "@/common/lib/cn";

type InputProps = ComponentProps<"input">;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      "h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none",
      className
    )}
    {...props}
  />
);
