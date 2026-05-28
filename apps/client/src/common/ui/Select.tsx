import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "@/common/lib/cn";

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
const EMPTY_SENTINEL = "__select_empty__";
const toInner = (value: string) => (value === "" ? EMPTY_SENTINEL : value);
const toOuter = (value: string) => (value === EMPTY_SENTINEL ? "" : value);

// shadcn 패턴의 커스텀 셀렉트. native <select>를 대체한다.
// 옵션은 배열로 전달, value는 string 단일. 숫자/유니언은 호출 측에서 캐스팅한다.
export const Select = ({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
}: SelectProps) => (
  <SelectPrimitive.Root
    value={toInner(value)}
    onValueChange={(next) => onValueChange(toOuter(next))}
    disabled={disabled}
  >
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-input px-3 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring data-[placeholder]:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <SelectPrimitive.Value placeholder={placeholder} />
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={4}
        className={cn(
          "z-50 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md",
          "min-w-[var(--radix-select-trigger-width)] max-h-[var(--radix-select-content-available-height)]"
        )}
      >
        <SelectPrimitive.Viewport className="p-1">
          {options.map((option) => (
            <SelectPrimitive.Item
              key={option.value}
              value={toInner(option.value)}
              disabled={option.disabled}
              className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=checked]:font-medium data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              <span className="absolute right-2 flex size-3.5 items-center justify-center">
                <SelectPrimitive.ItemIndicator>
                  <Check className="size-3.5 text-primary" />
                </SelectPrimitive.ItemIndicator>
              </span>
            </SelectPrimitive.Item>
          ))}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>
);
