import { type ComponentProps } from 'react';

import { cn } from '@/common/lib/cn';
import { typeColor, typeTextColor } from '@/common/lib/typeColor';

type TypeBadgeProps = {
  type: string;
} & ComponentProps<'span'>;

// 타입 정체성 배지. 18타입 정식 색을 배경으로 쓴다.
export const TypeBadge = ({ type, className, ...props }: TypeBadgeProps) => (
  <span
    className={cn('inline-flex items-center', 'rounded px-1.5 py-0.5', 'text-xs leading-none font-semibold', className)}
    style={{ backgroundColor: typeColor(type), color: typeTextColor(type) }}
    {...props}
  >
    {type}
  </span>
);
