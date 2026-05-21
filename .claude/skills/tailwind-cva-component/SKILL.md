---
name: tailwind-cva-component
description: Use when creating or modifying Tailwind CSS + CVA styled components, design tokens, or typography utilities.
---

# Tailwind CSS + CVA Component Guide

variant 기반 스타일링 컴포넌트를 생성하거나 디자인 시스템 작업을 할 때 이 스킬을 사용한다.

## cn() Utility

Tailwind 클래스를 조건부로 조합하는 유틸리티. `shared/lib/utils.ts`에 정의:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

모든 컴포넌트에서 `cn()`을 사용하여 클래스를 조합한다:

```typescript
<div className={cn('flex items-center gap-2', isActive && 'bg-accent-light3', className)}>
```

## CVA (class-variance-authority)

variant와 size 조합을 가진 컴포넌트에 사용:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps, type ReactElement } from 'react';

import { cn } from '@/common/lib';

const variants = cva('', {
  variants: {
    variant: {
      primary: [
        'py-2.5',
        'typography-body1 bg-neutral-normal1 text-neutral-light8',
        'hover:opacity-85',
        'active:opacity-100',
      ],
      secondary: [
        'py-2.5',
        'typography-body2 bg-neutral-light7 text-neutral-normal1 border-neutral-light2',
        'hover:bg-neutral-light4 hover:border-neutral-light2',
        'active:bg-neutral-light7',
        'disabled:hover:bg-neutral-light7',
      ],
      tertiary: [
        'py-1.75',
        'typography-body2 text-neutral-normal1 bg-neutral-light8',
        'hover:bg-neutral-light7',
        'active:bg-neutral-light8',
      ],
    },
    size: {
      sm: ['h-8'],
      md: ['h-9'],
      lg: ['h-12'],
    },
  },
});

type ButtonProps = {
  loading?: boolean;
} & ComponentProps<'button'> &
  VariantProps<typeof variants>;

export function Button({
  disabled,
  loading,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        variants({ variant, size }),
        'inline-flex items-center justify-center',
        'rounded-lg border px-2',
        'cursor-pointer border-transparent outline-none',
        'transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        loading && 'disabled:cursor-wait disabled:opacity-100',
        className,
      )}
    >
      {children}
    </button>
  );
}
```

### CVA Rules

- `cva('')`의 첫 번째 인자는 기본 클래스 (보통 빈 문자열).
- variant 값은 배열 형태로 관련 클래스를 그룹화한다.
- `VariantProps<typeof variants>`를 Props 타입에 intersection으로 포함한다.
- `cn()` 안에서 `variants({ variant, size })`를 **맨 앞**에 배치하고, `className`은 마지막에 둔다.

## Design Tokens

`index.css`의 `@theme`에 정의된 색상 토큰:

| Token | Examples |
|-------|---------|
| **neutral** | `neutral-normal1` (#111), `neutral-normal2` (#333), `neutral-light1`~`light8` |
| **accent** | `accent-normal1` (#7C35FF), `accent-light1`~`light3` |
| **support** | `support-normal1` (#5AA87E), `support-light1` |
| **error** | `error-normal1` (#FA474E), `error-light1` |
| **notification** | `notification-normal1` (#C73A3A) |
| **surface** | `surface-light1`, `surface-light2` |

### Shadows

- `shadow-neutral`: 포커스 링 (중립)
- `shadow-accent`: 카드/드롭다운 그림자
- `shadow-error`: 에러 포커스 링

## Typography Utilities

`index.css`의 `@utility`로 정의된 타이포그래피 클래스:

| Utility | Size | Weight |
|---------|------|--------|
| `typography-title1` | 2xl | bold |
| `typography-title2` | 2xl | semibold |
| `typography-title3` | lg | bold |
| `typography-title4` | base | semibold |
| `typography-title5` | base | medium |
| `typography-title6` | base | normal |
| `typography-body1` | sm | semibold |
| `typography-body2` | sm | normal |
| `typography-caption1` | xs | bold |
| `typography-caption2` | xs | normal |

### Usage

```tsx
<h2 className={cn('flex-1', 'typography-title1')}>제목</h2>
<p className={cn('typography-body2')}>내용</p>
<span className={cn('typography-caption2', 'text-neutral-light1')}>부가 정보</span>
```

## Font

Pretendard Variable 폰트를 `--font-sans`로 설정. CDN에서 로드:

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
```

## Tailwind v4 Specifics

- `@tailwindcss/vite` 플러그인 사용
- `@theme`로 디자인 토큰 정의 (CSS custom properties 기반)
- `@utility`로 커스텀 유틸리티 클래스 정의
- `tailwindcss-animated`로 애니메이션 클래스 사용 가능

## Component Styling Pattern

컴포넌트 스타일링의 일관된 패턴:

1. **CVA variants** (사용하는 경우, 항상 맨 앞)
2. 구조 클래스 (layout, flex)
3. 시각 클래스 (border, bg, text)
4. 인터랙션 클래스 (hover, active, disabled)
5. 조건부 클래스
6. 외부 `className` (항상 마지막)

```typescript
className={cn(
  variants({ variant, size }),                     // CVA (맨 앞)
  'inline-flex items-center justify-center',       // 구조
  'rounded-lg border bg-neutral-light8',           // 시각
  'hover:bg-neutral-light4 active:opacity-100',    // 인터랙션
  isSelected && 'bg-accent-light3',                // 조건부
  className,                                        // 외부
)}
```
