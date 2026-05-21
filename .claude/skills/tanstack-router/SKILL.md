---
name: tanstack-router
description: Use when creating or modifying TanStack Router route files in the `routes/` directory.
---

# TanStack Router Guide

`src/routes/`에서 라우트 파일을 생성하거나 수정할 때 이 스킬을 사용한다.

## File-based Routing

라우트 파일 구조가 URL 구조와 1:1로 매핑된다.
`@tanstack/router-plugin`이 `routeTree.gen.ts`를 자동 생성한다.

```
src/routes/
├── __root.tsx                  # 루트 레이아웃
├── index.tsx                   # / (리다이렉트)
├── dashboard.tsx               # /dashboard
├── auth/
│   └── sign-in.tsx             # /auth/sign-in
├── operations/
│   ├── users.tsx               # /operations/users (layout + Outlet)
│   ├── users/
│   │   ├── index.tsx           # /operations/users/ (목록)
│   │   └── $id.tsx             # /operations/users/:id (상세)
│   └── countries.tsx           # /operations/countries
└── security/
    ├── api-keys.tsx            # /security/api-keys (layout + Outlet)
    └── api-keys/
        ├── index.tsx           # /security/api-keys/ (목록)
        └── create.tsx          # /security/api-keys/create
```

## Basic Route

라우트 파일은 **얇은 wrapper**이다. 실제 UI 로직은 `pages/`에 위치한다.

```typescript
import { createFileRoute } from '@tanstack/react-router';

import { EntityPage } from '@/pages/entity';

export const Route = createFileRoute('/operations/entities/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <EntityPage />;
}
```

## Search Params with Zod

검색 파라미터가 있는 라우트는 Zod 스키마로 `validateSearch`를 정의한다:

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { EntitiesPage } from '@/pages/entities';

const searchEntitiesSchema = z.object({
  name: z.string().optional(),
  pageNumber: z.number().default(1),
  pageSize: z.number().default(10),
});

export const Route = createFileRoute('/security/entities/')({
  validateSearch: searchEntitiesSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <EntitiesPage />;
}
```

## Dynamic Route

동적 파라미터는 `$param` 파일명 형태:

```typescript
// routes/operations/users/$id.tsx
import { createFileRoute } from '@tanstack/react-router';

import { UserPage } from '@/pages/user';

export const Route = createFileRoute('/operations/users/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  return <UserPage />;
}
```

페이지 컴포넌트에서 파라미터 접근:

```typescript
import { useParams } from '@tanstack/react-router';

const { id } = useParams({ from: '/operations/users/$id' });
```

## Router Context 타입 선언

Root route 에 `createRootRouteWithContext` 로 `queryClient` 를 주입하면 모든 하위 route 의 `loader` 에서 typed 로 접근 가능.

```typescript
// routes/__root.tsx
import { type QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({ component: RouteComponent });

function RouteComponent() {
  return <Outlet />;
}
```

```typescript
// main.tsx
const queryClient = new QueryClient({
  /* ... */
});
const router = createRouter({ routeTree, context: { queryClient } });
```

## Loader + Suspense Prefetch

단건 조회 라우트 표준 패턴. `queryClient.ensureQueryData` 로 prefetch → 페이지 컴포넌트에서 `useSuspenseQuery` 로 항상 정의된 값 소비.

```typescript
// routes/artists/$id.tsx
import { createFileRoute } from '@tanstack/react-router';

import { findUserQueryOptions } from '@/features/model';
import { ArtistPage } from '@/pages/artist';

export const Route = createFileRoute('/artists/$id')({
  loader: ({ context: { queryClient }, params: { id } }) =>
    queryClient.ensureQueryData(findUserQueryOptions(id)),
  component: RouteComponent,
});

function RouteComponent() {
  return <ArtistPage />;
}
```

- **`loader`** = data prefetch 전용
- **`beforeLoad`** = 인증 / 리다이렉트 전용 (역할 교환 금지)
- 페이지 컴포넌트에선 `useSuspenseQuery(findUserQueryOptions(id))` 로 소비

`queryOptions` factory 작성법은 `tanstack-query-api-client` 스킬 참고.

## Layout Route (Outlet)

하위 라우트를 감싸는 레이아웃 라우트:

```typescript
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/security/api-keys')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
```

## Redirect

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});
```

## Navigation

```typescript
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();
navigate({ to: '/security/api-keys', search: { pageNumber: 1, pageSize: 10 } });
```

## Vite Configuration

```typescript
// vite.config.ts
import { tanstackRouter } from '@tanstack/router-plugin/vite';

const routerConfig: Partial<Config> = {
  target: 'react',
  autoCodeSplitting: true,
};

export default defineConfig({
  plugins: [tanstackRouter(routerConfig), react(), tailwindcss()],
});
```

## Rules

- 라우트 파일은 UI 로직을 최소한으로 유지한다 — `pages/`로 위임.
- `Route` export는 `react-refresh/only-export-components`에서 허용된다 (`allowExportNames: ['Route']`).
- search params 검증에는 Zod만 사용한다.
- `autoCodeSplitting: true`로 라우트별 자동 코드 분할.
