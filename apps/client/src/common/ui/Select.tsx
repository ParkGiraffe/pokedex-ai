import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '@/common/lib/cn';

export type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<SelectOption>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

// Radix Select.Item은 빈 문자열 value를 금지하므로, 외부 "" ↔ 내부 sentinel을 자동 변환한다.
// 호출 측은 빈 문자열을 그대로 쓸 수 있다.
const EMPTY_SENTINEL = '__select_empty__';
const toInner = (value: string) => (value === '' ? EMPTY_SENTINEL : value);
const toOuter = (value: string) => (value === EMPTY_SENTINEL ? '' : value);

// shadcn 패턴의 커스텀 셀렉트. native <select>를 대체한다.
// 옵션은 배열로 전달, value는 string 단일. 숫자/유니언은 호출 측에서 캐스팅한다.
export const Select = ({ value, onValueChange, options, placeholder, disabled, className }: SelectProps) => (
  <SelectPrimitive.Root
    value={toInner(value)}
    onValueChange={(next) => onValueChange(toOuter(next))}
    disabled={disabled}
  >
    <SelectPrimitive.Trigger
      className={cn(
        'flex items-center justify-between gap-2',
        'h-9 w-full rounded-md border px-3',
        'border-border bg-input text-foreground text-sm',
        'transition',
        'focus:border-primary focus:ring-ring focus:ring-2 focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[placeholder]:text-muted-foreground',
        className,
      )}
    >
      <SelectPrimitive.Value placeholder={placeholder} />
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="text-muted-foreground size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={4}
        className={cn(
          'max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)]',
          'z-50 overflow-hidden rounded-md border',
          'border-border bg-popover text-popover-foreground shadow-md',
        )}
      >
        <SelectPrimitive.Viewport className="p-1">
          {options.map((option) => (
            <SelectPrimitive.Item
              key={option.value}
              value={toInner(option.value)}
              disabled={option.disabled}
              className="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:font-medium"
            >
              <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              <span className="absolute right-2 flex size-3.5 items-center justify-center">
                <SelectPrimitive.ItemIndicator>
                  <Check className="text-primary size-3.5" />
                </SelectPrimitive.ItemIndicator>
              </span>
            </SelectPrimitive.Item>
          ))}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>
);
