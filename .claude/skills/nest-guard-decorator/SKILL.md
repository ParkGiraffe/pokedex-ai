---
name: nest-guard-decorator
description: Use when creating or modifying NestJS guards, custom property decorators, or parameter decorators.
---

# Guard and Custom Decorator Guide

가드, 프로퍼티 데코레이터, 파라미터 데코레이터를 생성하거나 수정할 때 이 스킬을 사용한다.

## Guard Combination: `Any(...guards)`

여러 가드 중 **하나라도** 통과하면 허용하는 가드 조합 유틸리티.
`common.guards.ts`에 정의되어 있다.

```typescript
import { CanActivate, ExecutionContext, Injectable, Type, UnauthorizedException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

export function Any(...guards: Type<CanActivate>[]): Type<CanActivate> {
  @Injectable()
  class AnyGuardMixin implements CanActivate {
    constructor(private readonly moduleRef: ModuleRef) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const results = await Promise.all(
        guards.map(async (Guard) => {
          const guard = await this.moduleRef.create(Guard);

          try {
            return { isAuthorized: !!(await guard.canActivate(context)) };
          } catch (error) {
            if (error instanceof UnauthorizedException) {
              return { isAuthorized: false, reason: error.message };
            }
            throw error;
          }
        }),
      );

      if (results.some((result) => result.isAuthorized)) {
        return true;
      }

      throw new UnauthorizedException(results.map((result) => result.reason));
    }
  }

  return AnyGuardMixin;
}
```

### Usage

```typescript
@UseGuards(Any(ApiKeyGuard, EntraIdGuard))
@Get('resource')
async findResource(): Promise<ResourceRes> { ... }
```

## Transform-based Property Decorators

DTO 필드에 적용하는 변환 데코레이터. `common.decorators.ts`에 정의.

### @EscapeWildcards()

SQL LIKE 와일드카드 문자를 이스케이프한다:

```typescript
export function EscapeWildcards(): PropertyDecorator {
  return Transform(({ value }): string => {
    return typeof value === 'string' ? escapeWildcards(value) : value;
  });
}
```

### @OmitEmpty()

빈 문자열을 `undefined`로 변환한다:

```typescript
export function OmitEmpty(options?: TransformOptions): PropertyDecorator {
  return Transform(({ value }): string | undefined => {
    return typeof value === 'string' && value === '' ? undefined : value;
  }, options);
}
```

### @Trim()

문자열 앞뒤 공백을 제거한다:

```typescript
export function Trim(): PropertyDecorator {
  return Transform(({ value }): string => {
    return typeof value === 'string' ? value.trim() : value;
  });
}
```

### DTO Usage

```typescript
export class SearchUsersDto {
  @IsOptional()
  @IsString()
  @EscapeWildcards()
  @OmitEmpty()
  @Trim()
  phoneNumber?: string;
}
```

## Metadata-based Property Decorators

엔티티 필드에 메타데이터를 부여하는 데코레이터. MikroORM Subscriber에서 사용.

### @Decompose(sourceField)

한글 자모 분해 대상 필드를 지정:

```typescript
export function Decompose(sourceField: string): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    const constructor = target.constructor;
    const meta = (Reflect.getMetadata(DECOMPOSE_METADATA_KEY, constructor) as Record<string, string>) || {};
    Reflect.defineMetadata(DECOMPOSE_METADATA_KEY, { ...meta, [propertyKey]: sourceField }, constructor);
  };
}
```

### @DeriveCountry(sourceField)

전화번호에서 국가 코드를 자동 추출하는 필드를 지정:

```typescript
export function DeriveCountry(sourceField: string): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    const constructor = target.constructor;
    const meta = (Reflect.getMetadata(DERIVE_COUNTRY_METADATA_KEY, constructor) as Record<string, string>) || {};
    Reflect.defineMetadata(DERIVE_COUNTRY_METADATA_KEY, { ...meta, [propertyKey]: sourceField }, constructor);
  };
}
```

## Parameter Decorators

요청 컨텍스트에서 인증 정보를 추출하는 데코레이터. `createParamDecorator`로 구현.

```typescript
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.user;
});
```

### Available Parameter Decorators

| Decorator | 설명 |
|-----------|------|
| `@CurrentPrincipal()` | Hello API 가 검증한 인증 정보 (JWT access token 응답) |
| `@CurrentApiKey()` | `X-API-KEY` 헤더에서 검증된 API 키 |
| `@CurrentSession()` | 현재 세션 정보 |
| `@CurrentUser()` | `EnsureUserInterceptor` 가 세팅한 `req.user` 를 `User` 타입으로 추출 |

## 인증 + User 파이프라인 (고정 조합)

로그인한 사용자의 요청을 다루는 컨트롤러는 **아래 조합을 복제**한다. 부분 조합은 금지.

```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
@UseGuards(AccessTokenGuard)
@UseInterceptors(EnsureUserInterceptor)
async create(@CurrentUser() user: User, @Body() dto: CreatePostDto): Promise<CreatePostRes> {
  return mapTo(CreatePostRes, await this.postsService.create({ user, ...dto }));
}
```

### 각 구성 요소

| 단계 | 담당 | 효과 |
|------|------|------|
| 1. `AccessTokenGuard` | `Authorization: Bearer <jwt>` 를 Hello API `/v1/users/me` 로 검증 | 응답 정보를 `req.principal` 에 세팅 |
| 2. `EnsureUserInterceptor` | `req.principal.id` 로 `UsersService.find` 또는 최초 접속 시 `create` | `req.user` 에 세팅 |
| 3. `@CurrentUser()` | 핸들러에서 `req.user` 추출 | `User` 타입으로 받음 |

### 규칙

- **Guard + Interceptor 둘 다 붙인다.** `EnsureUserInterceptor` 는 `req.principal` 존재를 전제로 동작하므로 **Guard 없이 Interceptor 만 붙이는 조합 금지**.
- **공개 엔드포인트(OG 공유 메타데이터 등)** 는 Guard/Interceptor 둘 다 붙이지 않는다.
- **관리자 엔드포인트** 는 이 조합 대신 `@UseGuards(EntraIdGuard)` + `@CurrentPrincipal()` 사용.

## File Location

| Type | Location |
|------|----------|
| Guard utilities | `src/common/common.guards.ts` |
| Property decorators | `src/common/common.decorators.ts` |
| Module-specific decorators | `src/{module}/{module}.decorators.ts` |
| Auth guards & strategies | `src/auth/guards/` |
| Parameter decorators | `src/auth/guards/` (인증 관련) |
