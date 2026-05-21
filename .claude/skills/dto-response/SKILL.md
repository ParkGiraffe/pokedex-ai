---
name: dto-response
description: Use when creating or modifying DTO files in the `dto/` folder.
---

# DTO and Response Class Guide

`dto/` 폴더에서 DTO 파일을 생성하거나 수정할 때 이 스킬을 사용한다.

## Input DTO (Request)

```typescript
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

import { EntityEnum } from '../entity.enums';

export class CreateEntityDto {
  @IsNotEmpty()
  @IsString()
  requiredField!: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  optionalField?: string;

  @IsOptional()
  @IsDate()
  dateField?: string;

  @IsOptional()
  @IsEnum(EntityEnum)
  enumField?: EntityEnum;
}
```

### Input DTO Rules

1. **class-validator 데코레이터 사용**
   - `@IsNotEmpty()`: 필수 필드
   - `@IsOptional()`: 선택 필드
   - `@IsString()`, `@IsNumber()`, `@IsBoolean()`: 타입 검증
   - `@IsEnum()`: enum 값 검증
   - `@Length()`: 문자열 길이 제한
   - `@IsDate()`: ISO 8601 날짜 문자열

2. **Field Declaration**
   - 필수 필드: `!` (definite assignment assertion)
   - 선택 필드: `?` (optional)

3. **Custom Decorators**
   - 모듈별 `*.decorators.ts` 또는 `common.decorators.ts`에 정의한다
   - 공통 DTO 데코레이터: `@/common/common.decorators`의 `@EscapeWildcards()`, `@OmitEmpty()`, `@Trim()`
   - 모듈별 검증기 (예: `auth.decorators.ts`의 `@IsE164()`)

4. **Naming Convention**
   - Find: `Find{Entity}Dto`
   - Create: `Create{Entity}Dto`
   - Update: `Update{Entity}Dto`
   - Search: `Search{Entity}Dto` (페이지네이션 파라미터 포함)
   - Other: `{Action}{Entity}Dto`

5. **Query Parameter Coercion**
   - 숫자 query param: `@Type(() => Number)` 사용
   - boolean/배열 query param: `@Transform()` 사용

## Search DTO Pattern

```typescript
import { Expose, Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { EscapeWildcards, OmitEmpty, Trim } from '@/common/common.decorators';

export class SearchEntityDto {
  @IsOptional()
  @IsString()
  @EscapeWildcards()
  @OmitEmpty()
  @Trim()
  name?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNumber!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize!: number;
}
```

## Output Response Class

### CreateXxxRes — `{ id }` 만

생성 응답은 **id 만 반환**한다. 나머지 필드는 client 가 GET 으로 재조회한다. 초기 응답에 전체 필드를 넣으면 재사용 상황에서 결과 형태가 중복·일관성이 깨진다.

```typescript
// create-entity.dto.ts
export class CreateEntityRes {
  @Expose()
  id!: string;
}
```

### FindXxxRes — 엔티티 전 필드

```typescript
// find-entity.dto.ts
import { Expose } from 'class-transformer';

import { EntityEnum } from '../entity.enums';

export class FindEntityRes {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  enumField!: EntityEnum;

  @Expose()
  createdAt!: Date;
}
```

### UpdateXxxRes — 독립 클래스

서비스가 수정된 엔티티를 반환하므로 `FindXxxRes` 와 구조는 유사하지만 **독립 클래스로 각 파일에 정의**한다. `as` 재export 또는 inline inheritance(`class UpdateRes extends FindRes {}`) 금지 — 나중에 응답 형태가 갈라질 때 연쇄 변경을 막기 위함.

### 배열 필드

```typescript
@Expose() @Type(() => ChildRes) children!: ChildRes[]
```

plain 배열에는 자동 작동.

### MikroORM Collection

`OneToMany` Collection 은 class-transformer 가 기본으로 직렬화하지 못한다. DTO 레벨에서 `@Transform` + 공용 `toArray` 헬퍼로 해결한다 (공용 유틸은 수정하지 말고 그대로 쓸 것).

### Output Response Rules

1. **`@Expose()` 데코레이터 필수**
   - 노출할 모든 필드에 `@Expose()`를 선언한다
   - `excludeExtraneousValues: true` 옵션과 함께 동작한다

2. **Naming Convention**
   - Find: `Find{Entity}Res`
   - Create: `Create{Entity}Res`
   - Update: `Update{Entity}Res`
   - Search (단일 항목): `Search{Entity}Res`
   - Search (목록 래퍼): `Search{Entities}Res`
   - Other: `{Action}{Entity}Res`

3. **Entity → Response Transformation**

```typescript
import { mapTo } from '@/common/common.utils';

return mapTo(FindEntityRes, entity);
```

## Nested Response Pattern

중첩 Response 클래스에는 `@Type(() => ClassName)`을 사용한다:

```typescript
import { Expose, Type } from 'class-transformer';

export class SearchEntityRes {
  @Expose()
  id!: string;

  @Expose()
  name!: string;
}

export class SearchEntitiesRes {
  @Expose()
  @Type(() => SearchEntityRes)
  entities!: SearchEntityRes[];

  @Expose()
  totalCount!: number;

  @Expose()
  pageNumber!: number;

  @Expose()
  pageSize!: number;

  @Expose()
  totalPages!: number;
}
```

## DTO/Response Same File Pattern

DTO와 Response가 밀접하게 관련된 경우(예: update API) 같은 파일에 정의한다:

```typescript
// update-entity.dto.ts
import { Expose } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateEntityDto {
  @IsOptional()
  @IsString()
  @Length(0, 30)
  name?: string;
}

export class UpdateEntityRes {
  @Expose()
  id!: string;

  @Expose()
  name!: string;
}
```

## mapTo Utility

`common.utils.ts`에 정의된 변환 함수:

```typescript
import { type ClassConstructor, plainToInstance } from 'class-transformer';

export function mapTo<T, I>(type: ClassConstructor<T>, instance: I): T {
  return plainToInstance(type, instance, {
    excludeExtraneousValues: true,
  });
}
```

## Custom Validator Pattern

```typescript
import { applyDecorators } from '@nestjs/common';
import { Matches } from 'class-validator';

export function IsE164(): PropertyDecorator {
  return applyDecorators(
    Matches(/^\+[1-9]\d{1,14}$/, {
      message: '전화번호는 E.164을 준수해야 합니다.',
    }),
  );
}
```

## File Structure

```
src/{module}/dto/
├── create-{entity}.dto.ts
├── update-{entity}.dto.ts
├── find-{entity}.dto.ts
├── search-{entities}.dto.ts
└── index.ts  # barrel export
```

### Barrel Export

```typescript
export { FindEntityRes } from './find-entity.dto';
export { SearchEntityDto, SearchEntitiesRes } from './search-entities.dto';
export { UpdateEntityDto, UpdateEntityRes } from './update-entity.dto';
```

## ValidationPipe Configuration

`main.ts`의 전역 파이프 설정:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```
