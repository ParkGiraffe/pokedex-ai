import { type ComponentProps } from 'react';

import { cn } from '@/common/lib/cn';

type InputProps = ComponentProps<'input'>;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      'border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-ring h-9 w-full rounded-md border px-3 text-sm focus:outline-none',
      className,
    )}
    {...props}
  />
);
