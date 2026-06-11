import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { cn } from '@/common/lib/cn';

const button = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-md',
    'font-medium',
    'transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
        ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-5 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type ButtonProps = VariantProps<typeof button> &
  ComponentProps<'button'> & {
    asChild?: boolean;
  };

export const Button = ({ variant, size, className, type = 'button', asChild, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp type={asChild ? undefined : type} className={cn(button({ variant, size }), className)} {...props} />;
};
