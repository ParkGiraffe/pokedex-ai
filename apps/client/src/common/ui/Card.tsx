import { type ComponentProps } from 'react';

import { cn } from '@/common/lib/cn';

type CardProps = ComponentProps<'div'>;

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn('rounded-xl border p-4', 'border-border bg-card text-card-foreground shadow-sm', className)}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: CardProps) => (
  <div className={cn('flex flex-col gap-1', 'pb-3', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: ComponentProps<'h3'>) => (
  <h3 className={cn('text-sm font-semibold tracking-tight', className)} {...props} />
);

export const CardDescription = ({ className, ...props }: ComponentProps<'p'>) => (
  <p className={cn('text-muted-foreground text-xs', className)} {...props} />
);

export const CardContent = ({ className, ...props }: CardProps) => (
  <div className={cn('flex flex-col gap-2', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: CardProps) => (
  <div className={cn('flex items-center justify-between gap-2', 'pt-3', className)} {...props} />
);
