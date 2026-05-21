---
name: tanstack-query-api-client
description: Use when creating or modifying TanStack Query hooks (useQuery, useMutation) or the API client setup.
---

# TanStack Query + API Client Guide

`model/` 디렉터리에서 Query 훅을 생성하거나 수정하거나, API 클라이언트 설정을 변경할 때 이 스킬을 사용한다.

## API Client Setup

### Axios Instance (`shared/lib/api-client.ts`)

```typescript
import axios from 'axios';
import qs from 'qs';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL 환경변수가 설정되지 않았습니다.');
}

export const apiClient = axios.create({
  baseURL: API_URL,
  paramsSerializer: (params: Record<string, unknown>): string => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
  },
});
```

### Request Interceptor (MSAL Token)

```typescript
apiClient.interceptors.request.use(async (config) => {
  const account = entraIdClient.getActiveAccount();

  if (account) {
    try {
      const response = await entraIdClient.acquireTokenSilent({
        scopes: ENTRA_ID_SCOPES,
        account,
      });
      config.headers.Authorization = `Bearer ${response.accessToken}`;
    } catch (error: unknown) {
      if (error instanceof InteractionRequiredAuthError) {
        await entraIdClient.acquireTokenRedirect({ scopes: ENTRA_ID_SCOPES });
      }
      throw error;
    }
  }

  return config;
});
```

### Response Interceptor (401 Redirect)

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === HttpStatusCode.Unauthorized) {
      window.location.href = window.location.origin;
    }
    return Promise.reject(error);
  },
);
```

## useQuery Pattern

### Basic Structure

```typescript
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient, type WithQueryStatus } from '@/common/lib';

import { type Entity } from './entity';

export interface SearchEntitiesParams {
  name?: string;
  pageNumber: number;
  pageSize: number;
}

interface SearchEntitiesRes {
  entities: Entity[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export function useSearchEntities(params: SearchEntitiesParams): WithQueryStatus<SearchEntitiesRes> {
  const { data, isLoading, isError } = useQuery({
    placeholderData: keepPreviousData,
    queryKey: ['/v1/entities/search', params],
    queryFn: async () => {
      const response = await apiClient.get<SearchEntitiesRes>('/v1/entities/search', {
        params,
      });
      return response.data;
    },
  });

  return {
    ...(data ?? {
      entities: [],
      totalCount: 0,
      pageNumber: 0,
      pageSize: 0,
      totalPages: 0,
    }),
    isLoading,
    isError,
  };
}
```

### Rules

- `queryKey`에는 API 경로를 첫 번째 요소로, params를 두 번째 요소로 넣는다.
- 검색/목록 쿼리에는 `placeholderData: keepPreviousData`를 사용한다.
- 반환 타입은 `WithQueryStatus<T>` (`T & { isLoading: boolean; isError: boolean }`).
- data가 없을 때의 기본값을 spread 연산자로 제공한다.

### WithQueryStatus Type

```typescript
export type WithQueryStatus<T> = T & {
  isLoading: boolean;
  isError: boolean;
};
```

## useSuspenseQuery + queryOptions Factory

TanStack Router `loader` 로 prefetch 하고 페이지 컴포넌트에서 소비하는 패턴. **queryOptions factory 를 loader 와 hook 이 공유**한다.

```typescript
import { useSuspenseQuery, type UseSuspenseQueryOptions, type UseSuspenseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/common/lib';

import { type User } from './user';

type FindUserQueryKey = readonly ['/v1/users', string];

export function findUserQueryOptions(id: string): UseSuspenseQueryOptions<User, Error, User, FindUserQueryKey> {
  return {
    queryKey: ['/v1/users', id],
    queryFn: async () => (await apiClient.get<User>(`/v1/users/${id}`)).data,
  };
}

export function useFindUser(id: string): UseSuspenseQueryResult<User, Error> {
  return useSuspenseQuery(findUserQueryOptions(id));
}
```

### Rules

- **리턴 타입**은 `UseSuspenseQueryOptions<TData, TError, TData, TQueryKey>` 로 명시한다.
  - ❌ `ReturnType<typeof queryOptions<T>>` — `queryOptions` 오버로드에 `skipToken` 버전이 포함돼 `useSuspenseQuery` 와 타입 충돌
  - ❌ `eslint-disable` — 사용 금지
- `.ts` 파일에서 `@typescript-eslint/explicit-module-boundary-types: error` 이므로 리턴 타입 필수.
- `queryKey` 는 `as const` 없이도 리턴 타입 선언이 `readonly ['/path', id]` 형태라 narrow type 유지.
- 소비자는 `useSuspenseQuery` 로 받으면 `data: T` (not `T | undefined`), 로딩 분기 불필요.
- Route loader 에서 `queryClient.ensureQueryData(findUserQueryOptions(id))` 로 prefetch.

### loader 연동 예시

```typescript
// routes/artists/$id.tsx
export const Route = createFileRoute('/artists/$id')({
  loader: ({ context: { queryClient }, params: { id } }) => queryClient.ensureQueryData(findUserQueryOptions(id)),
  component: RouteComponent,
});
```

자세한 Router 연동은 `tanstack-router` 스킬 참고.

## useMutation Pattern

```typescript
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/common/lib';

interface CreateEntityParams {
  name: string;
}

interface CreateEntityRes {
  id: string;
}

export function useCreateEntity(): UseMutationResult<CreateEntityRes, Error, CreateEntityParams> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: CreateEntityParams) => {
      const response = await apiClient.post('/v1/entities', { name });
      return response.data as CreateEntityRes;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/v1/entities/search'] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
```

### Rules

- 반환 타입을 `UseMutationResult<Res, Error, Params>`로 명시한다.
- `onSuccess`에서 관련 쿼리를 `invalidateQueries`로 무효화한다.
- Params/Res 인터페이스는 같은 파일에 정의한다.
- `apiClient`를 직접 사용한다 (별도 API layer 없음).

## File Naming

- `use{Action}{Entity}.ts` 형태
- 예시: `useSearchUsers.ts`, `useCreateApiKey.ts`, `useDeleteOrigin.ts`, `useFindUser.ts`
- 타입 파일: `{entity}.ts` (예: `api-key.ts`, `user.ts`)

## File Location

```
src/pages/{page}/model/
├── {entity}.ts              # 타입 정의
├── useSearch{Entities}.ts   # 목록 조회
├── useFind{Entity}.ts       # 단건 조회
├── useCreate{Entity}.ts     # 생성
├── useUpdate{Entity}.ts     # 수정
├── useDelete{Entity}.ts     # 삭제
└── index.ts                 # barrel export
```
