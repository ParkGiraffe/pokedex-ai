import { type ReactNode } from "react";

import { cn } from "@/common/lib/cn";

type FieldProps = {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
};

export const Field = ({ label, htmlFor, className, children }: FieldProps) => (
  <label htmlFor={htmlFor} className={cn("flex flex-col gap-1", className)}>
    <span className="text-xs font-medium text-neutral-400">{label}</span>
    {children}
  </label>
);
