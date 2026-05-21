import { type ComponentProps } from "react";

import { cn } from "@/common/lib/cn";

type CardProps = ComponentProps<"div">;

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn("rounded-lg border border-neutral-800 bg-neutral-900/60 p-4", className)}
    {...props}
  />
);
