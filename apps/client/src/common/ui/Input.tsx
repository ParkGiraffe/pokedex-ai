import { type ComponentProps } from 'react';

import { cn } from '@/common/lib/cn';

type InputProps = ComponentProps<'input'>;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      'h-9 w-full rounded-md border px-3',
      'border-border bg-card text-foreground text-sm',
      'focus:border-ring placeholder:text-muted-foreground focus:outline-none',
      className,
    )}
    {...props}
  />
);
