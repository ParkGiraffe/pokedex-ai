import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { cn } from '@/common/lib/cn';

const badge = cva('inline-flex items-center gap-1 rounded-md font-medium leading-none border', {
  variants: {
    variant: {
      default: 'border-transparent bg-secondary text-secondary-foreground',
      success: 'border-transparent bg-success/15 text-success',
      destructive: 'border-transparent bg-destructive/15 text-destructive',
      warning: 'border-transparent bg-warning/15 text-warning',
      outline: 'border-border text-foreground',
      muted: 'border-transparent bg-muted text-muted-foreground',
    },
    size: {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-sm',
    },
  },
  defaultVariants: { variant: 'default', size: 'sm' },
});

type BadgeProps = VariantProps<typeof badge> & ComponentProps<'span'>;

export const Badge = ({ variant, size, className, ...props }: BadgeProps) => (
  <span className={cn(badge({ variant, size }), className)} {...props} />
);
