import { type ComponentProps } from 'react';

import { cn } from '@/common/lib/cn';
import { typeColor, typeTextColor } from '@/common/lib/typeColor';

type TypeBadgeProps = {
  type: string;
} & ComponentProps<'span'>;

export const TypeBadge = ({ type, className, ...props }: TypeBadgeProps) => (
  <span
    className={cn('inline-flex items-center', 'rounded px-1.5 py-0.5', 'text-xs leading-none font-semibold', className)}
    style={{ backgroundColor: typeColor(type), color: typeTextColor(type) }}
    {...props}
  >
    {type}
  </span>
);
