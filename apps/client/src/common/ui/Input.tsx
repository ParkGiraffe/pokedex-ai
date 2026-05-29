import { type ComponentProps } from "react";

import { cn } from "@/common/lib/cn";

type InputProps = ComponentProps<"input">;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      "h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none",
      className
    )}
    {...props}
  />
);
