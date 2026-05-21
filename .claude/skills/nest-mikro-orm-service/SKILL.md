---
name: nest-mikro-orm-service
description: Use when creating or modifying NestJS service files that interact with MikroORM.
---

# NestJS Service + MikroORM Guide

NestJS 서비스 파일에서 MikroORM을 사용하여 데이터베이스 작업을 수행할 때 이 스킬을 사용한다.

MikroORM v6+에서 `persistAndFlush`와 `removeAndFlush`는 deprecated이다.
대신 메서드 체이닝을 사용한다: `persist(entity).flush()`, `remove(entity).flush()`.

## Basic Service Structure

```typescript
import {
  EntityManager,
  FilterQuery,
  NotFoundError,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUndefined, omitBy } from 'es-toolkit';

import { getTotalPages } from '@/common/common.utils';

import { Entity } from './entities/entity.entity';

@Injectable()
export class EntityService {
  constructor(private readonly entityManager: EntityManager) {}
  // CRUD 메서드...
}
```

## CRUD Patterns

### Create

```typescript
async create(params: {
  field: string;
  optionalField?: string;
}): Promise<Entity> {
  const entity = this.entityManager.create(Entity, params);

  try {
    await this.entityManager.persist(entity).flush();
  } catch (error) {
    if (error instanceof UniqueConstraintViolationException) {
      throw new ConflictException('중복된 데이터가 존재합니다.');
    }
    throw error;
  }

  return entity;
}
```

### Read (Single)

```typescript
async find(where: FilterQuery<Entity>): Promise<Entity> {
  try {
    return await this.entityManager.findOneOrFail(Entity, where);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundException('찾을 수 없는 데이터입니다.');
    }
    throw error;
  }
}
```

### findAll (Pagination)

**무한스크롤 피드는 cursor, 페이지 UI는 offset** 중 모듈에 맞게 선택한다.

#### Offset pagination (일반 리소스)

```typescript
async findAll(params: {
  where: FilterQuery<Entity>;
  pageNumber: number;
  pageSize: number;
}): Promise<{
  items: Entity[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}> {
  const { where, pageNumber, pageSize } = params;

  const [items, totalCount] = await this.entityManager.findAndCount(Entity, where, {
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    orderBy: { createdAt: 'DESC' },
  });

  return { items, totalCount, pageNumber, pageSize, totalPages: getTotalPages(totalCount, pageSize) };
}
```

- 컨트롤러가 `where` 를 조립해서 넘긴다 (`omitBy(params, isUndefined) as FilterQuery<Entity>`).
- `items` 키는 도메인 명사로 alias 가능 — `users`, `posts` 등 (DTO Response 와 키 이름을 맞춘다).

#### Cursor pagination + 접근 제어 리소스

소유자/공개 범위/상태 조합이 필요한 리소스(개인 게시물 등)는 **필터 필드를 flatten**해서 받고, 서비스 내부 헬퍼(`buildAccessWhere` / `buildReadableWhere`)가 최종 `where` 를 구성한다.

```typescript
async findAll(params: {
  status?: Status;
  visibility?: Visibility;
  cursor?: string;
  limit?: number;
  currentUserId: string;
}): Promise<{ items: Post[]; nextCursor?: string }> {
  const where = this.buildReadableWhere(params);  // 소유자·공개 범위·상태 조합

  // ... cursor 기반 조회
}
```

**중요**: 클라이언트가 직접 `where` 를 쓰면 타인 PRIVATE 데이터 조회 같은 접근 우회가 생긴다. **접근 제어 리소스의 `where` 는 서비스가 단독 소유한다** — 컨트롤러에서 `where` 를 넘겨받지 않는다.

### Update (RO-RO with Entity)

컨트롤러가 먼저 엔티티를 조회한 뒤 서비스에 전달한다:

```typescript
async update(params: {
  entity: Entity;
  name?: string;
  optionalField?: string;
}): Promise<Entity> {
  const { entity } = params;
  this.entityManager.assign(entity, omitBy(params, isUndefined));

  try {
    await this.entityManager.flush();
  } catch (error) {
    if (error instanceof UniqueConstraintViolationException) {
      throw new ConflictException('중복된 데이터가 존재합니다.');
    }
    throw error;
  }

  return entity;
}
```

### Delete (RO-RO with Entity)

```typescript
async remove(params: { entity: Entity }): Promise<void> {
  const { entity } = params;
  await this.entityManager.remove(entity).flush();
}
```

## Core Rules

### 1. EntityManager Injection

- 모든 DB 작업에 `EntityManager`를 주입한다
- `private readonly entityManager: EntityManager`
- 이 프로젝트에서는 Repository 패턴을 사용하지 않는다

### 2. Method Usage

| Operation | Method |
| --------- | ------ |
| Create | `em.create()` → `em.persist(e).flush()` |
| Read | `em.findOne()`, `em.findOneOrFail()`, `em.find()` |
| findAll | `em.findAndCount()` + `getTotalPages()` (offset), cursor 조건 기반 `em.find()` (cursor) |
| Update | `em.assign()` → `em.flush()` |
| Delete | `em.remove(e).flush()` |

### 3. RO-RO Parameter Pattern

- 모든 메서드에 객체 파라미터를 사용한다 (Receive an Object, Return an Object)
- `update`와 `delete`는 id가 아닌 엔티티 객체를 직접 전달받는다
- 컨트롤러가 `findOne()`으로 먼저 조회한 뒤 엔티티를 전달한다

### 4. Exception Handling

- `UniqueConstraintViolationException` → `ConflictException` (409)
- `NotFoundError` → `NotFoundException` (404)
- 예외 메시지는 한국어로 작성한다

### 5. Handling Undefined Fields

- `es-toolkit`의 `omitBy`, `isUndefined`를 사용한다
- 수정 시 undefined 필드를 제외한다

## Transactions

### Programmatic Approach

```typescript
await this.entityManager.transactional(async (em) => {
  const entity = await em.findOne(Entity, { id });
  entity.field = 'new value';
});
```

### Decorator Approach

```typescript
import { Transactional } from '@mikro-orm/core';

@Transactional()
async complexOperation(): Promise<void> {
  // 트랜잭션 내에서 실행된다
}
```

## Custom Repository (Advanced)

복잡하고 재사용 가능한 DB 쿼리를 캡슐화해야 할 때만 사용한다.
이 프로젝트에서는 일반적으로 Repository 패턴을 사용하지 않으며 — `EntityManager`를 직접 사용한다.

```typescript
import { EntityRepository } from '@mikro-orm/core';
import { Entity } from './entities/entity.entity';

export class CustomRepository extends EntityRepository<Entity> {
  async findWithCustomLogic() {
    return this.createQueryBuilder('e')
      .where({ 'e.active': true })
      .getResultList();
  }
}
```

엔티티에 등록 (필요한 경우에만):

```typescript
@Entity({ repository: () => CustomRepository })
export class EntityName {
  // ...
}
```

## File Naming

- 서비스 파일: `{module}.service.ts`
- Repository 파일: `{module}.repository.ts` (Custom Repository 사용 시에만)
- 엔티티당 하나의 서비스
