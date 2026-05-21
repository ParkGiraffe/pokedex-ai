import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";

import { cn } from "@/common/lib/cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-emerald-600 text-white hover:bg-emerald-500",
        secondary: "bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
        ghost: "text-neutral-300 hover:bg-neutral-800",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type ButtonProps = VariantProps<typeof button> & ComponentProps<"button">;

export const Button = ({ variant, size, className, type = "button", ...props }: ButtonProps) => (
  <button type={type} className={cn(button({ variant, size }), className)} {...props} />
);
