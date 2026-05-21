---
name: testing-vitest
description: Use when writing tests for NestJS + MikroORM with transaction rollback and real DB integration.
---

# Vitest Testing Guide

NestJS + MikroORM 프로젝트의 테스트(`*.spec.ts`, `*.e2e-spec.ts`)를 작성할 때 이 스킬을 사용한다.

## Test Types

1. **통합 테스트 (*.spec.ts)**: 서비스 레이어, 실 DB 사용
2. **E2E 테스트 (*.e2e-spec.ts)**: API 엔드포인트 전체 흐름

> ⚠️ 컨트롤러 단위 테스트를 작성하지 않는다
> ⚠️ Mock 대신 실 DB 연결을 사용한다

## Service Integration Test Structure

```typescript
import { type EntityManager, MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

import { CreateEntityDto } from './dto';
import { Entity } from './entities/entity.entity';
import { EntityService } from './entity.service';
import { Random } from '@test/test.utils';

async function generateCreateEntityDto(): Promise<CreateEntityDto> {
  const dto = plainToInstance(CreateEntityDto, {
    field: Random.name(),
  });
  await validateOrReject(dto);
  return dto;
}

describe('EntityService 테스트', () => {
  let testingModule: TestingModule;
  let mikroOrm: MikroORM;
  let entityService: EntityService;
  let entityManager: EntityManager;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [MikroOrmModule.forRoot(mikroOrmConfig), MikroOrmModule.forFeature([Entity])],
      providers: [EntityService],
    }).compile();

    mikroOrm = testingModule.get(MikroORM);
    entityService = testingModule.get(EntityService);
  });

  beforeEach(async () => {
    entityManager = mikroOrm.em.fork();
    Object.assign(entityService, { entityManager });
    await entityManager.begin();
  });

  afterEach(async () => {
    await entityManager.rollback();
  });

  afterAll(async () => {
    await testingModule.close();
  });

  describe('생성', () => {
    test('신규 엔티티를 생성한다.', async () => {
      const dto = await generateCreateEntityDto();
      const entity = await entityService.create(dto);

      expect(entity.id).toBeDefined();
    });
  });
});
```

## Transaction Rollback Pattern

각 테스트는 독립적으로 실행되어야 한다:

```typescript
beforeEach(async () => {
  entityManager = mikroOrm.em.fork();
  Object.assign(entityService, { entityManager });
  await entityManager.begin();  // 트랜잭션 시작
});

afterEach(async () => {
  await entityManager.rollback();  // 롤백으로 데이터 정리
});
```

## E2E Test Structure

```typescript
import {type INestApplication, ValidationPipe} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {Logger} from 'nestjs-pino';
import request from 'supertest';
import {type App} from 'supertest/types';

import {AppModule} from '../src/app.module';
import {Random} from '@test/test.utils';

describe('E2E 테스트', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(app.get(Logger));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('EntityController 테스트', () => {
    describe('(GET) /entities/:id', () => {
      test('엔티티를 조회한다.', async () => {
        const entityId = '019afbdc-b30f-771f-a859-7c17a7dea978';
        const response = await request(app.getHttpServer())
          .get(`/entities/${entityId}`)
          .expect(200);

        expect(response.body.id).toEqual(entityId);
      });

      test('존재하지 않는 엔티티를 조회한다.', async () => {
        await request(app.getHttpServer())
          .get(`/entities/${Random.uuid()}`)
          .expect(404);
      });
    });
  });
});
```

## Test Naming Convention

### describe Blocks

- 최상위: `{Service/Controller}Service 테스트`
- 기능 단위: 동작의 한국어 설명 (예: `사용자 생성`, `OTP 발송`)
- HTTP 메서드: `(METHOD) /path/to/endpoint`

### test Blocks

- 한국어로 구체적인 시나리오를 기술한다
- `~한다.` 형태로 마무리한다

```typescript
describe('사용자 생성', () => {
  test('신규 사용자를 생성한다.', async () => { });
  test('중복 사용자를 생성한다.', async () => { });
});
```

## DTO Generation Helper

테스트용 DTO를 헬퍼 함수로 생성한다:

```typescript
import {Random} from '@test/test.utils';

async function generateCreateUserDto(): Promise<CreateUserDto> {
  const dto = plainToInstance(CreateUserDto, {
    phoneNumber: Random.phoneNumber(),
  });
  await validateOrReject(dto);
  return dto;
}
```

## Test Fixtures

재사용 가능한 테스트 데이터는 fixture 파일로 분리한다:

```typescript
// test/test.types.ts
import { type User } from '../src/users/entities/user.entity';

export type UserFixture = Omit<User, 'createdAt' | 'updatedAt'>;

// test/test.fixtures.ts
import { UserGender } from '../src/users/users.enums';
import { type UserFixture } from './test.types';

export const USER_FIXTURE: readonly UserFixture[] = [
  {
    id: '019afbdc-b30f-771f-a859-7c17a7dea978',
    phoneNumber: '+971501234567',
    name: '강감찬',
    birthdate: new Date('1031-09-15'),
    gender: UserGender.MALE,
  },
  {
    id: '019afbdc-df87-79dc-a7c8-e67aaec36698',
    phoneNumber: '+971501234568',
    name: '신사임당',
    birthdate: new Date('1504-12-05'),
    gender: UserGender.FEMALE,
  },
] as const;

// test/test.utils.ts
import {type UserFixture} from '@test/test.fixtures';

export class Random {
  static userFixture(criteria: Partial<UserFixture> = {}): UserFixture {
    const userFixture = sample(
      USER_FIXTURE.filter((user) => {
        return isMatch(user, criteria);
      }),
    );

    if (!userFixture) {
      throw new Error('조건에 맞는 사용자가 없습니다.');
    }

    return userFixture;
  }
}
```

## `Random.xxxFixture` criteria

fixture 선택은 **`Partial<XxxFixture>` 객체 criteria 만** 쓴다. predicate 함수 오버로드·복잡한 matcher 금지 — `Random` 시그니처 일관성을 깬다.

```typescript
// OK — 정확히 하나로 수렴
const fixture = Random.postFixture({ status: Status.DRAFT, userId: USER_FIXTURES[0].id });

// OK — 여러 개 매칭이면 랜덤 선택해도 테스트가 동작하는지 확인 후 사용
const fixture = Random.postFixture({ visibility: Visibility.PUBLIC, status: Status.PUBLISHED });
```

### criteria 로 해결 안 되는 경우

배열 내용 검사, 복합 조건 등 `Partial` 로 표현 불가한 조건은 **fixture 식별자를 로컬 상수로 고정**해서 `{ id }` criteria 로 선택한다.

```typescript
describe('포스트 삭제', () => {
  const IMAGE_POST_ID = '019c7ecc-b93c-706e-8472-6a7f371e0002';

  test('삭제 시 미디어도 함께 삭제된다.', async () => {
    const postFixture = Random.postFixture({ id: IMAGE_POST_ID });
    // ...
  });
});
```

predicate 함수를 `Random.xxxFixture` 에 추가해 확장하지 않는다.

## 인증 관련 테스트 셋업

로그인 필요 엔드포인트(`AccessTokenGuard` + `EnsureUserInterceptor`)를 테스트할 때:

- **`vitest.setup.ts`** 의 MSW 핸들러가 `/v1/users/me` 응답을 모킹한다. Authorization 헤더의 JWT `sub` 를 디코드해서 `Random.userFixture({ id: sub })` 를 반환 — 토큰과 사용자가 자연스럽게 매칭된다.
- **e2e 테스트** 는 고정 상수 토큰(`UserAccessToken.VALID` 등)을 `Authorization: Bearer ${TOKEN}` 으로 보낸다. 각 토큰의 `sub` 은 대응 사용자 fixture id 에 미리 매칭되어 있다.
- **새 토큰이 필요하면**:
  1. `test/test.constants.ts` 에 토큰 상수 추가
  2. 대응하는 사용자 fixture 를 `test/test.fixtures.ts` 에 추가 (토큰 `sub` 과 fixture `id` 일치시킬 것)

## test.each Pattern

여러 케이스에 대해 테스트를 반복 실행한다:

```typescript
test.each(PHONE_NUMBER_TEST_CASES)(
  '$country 전화번호로 OTP를 발송한다.',
  async ({ phoneNumber }) => {
    const result = await service.sendOtp({ phoneNumber: phoneNumber() });
    expect(result.message).toBe('OTP 발송 성공');
  }
);
```

## File Structure

```
src/
├── {module}/
│   └── {module}.service.spec.ts      # 서비스 테스트
test/
└── app.e2e-spec.ts                   # E2E 테스트
```

## Vitest Configuration

단위 테스트와 E2E 테스트는 **별도** 설정 파일을 사용한다:

### Unit Test Config (`vitest.config.ts`)

```typescript
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    globalSetup: 'vitest.globalSetup.ts',
    include: ['src/**/*.spec.ts'],
  },
  plugins: [swc.vite()],
});
```

### E2E Test Config (`test/vitest.e2e-config.ts`)

```typescript
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    globalSetup: 'vitest.globalSetup.ts',
    include: ['test/**/*.e2e-spec.ts'],
  },
  plugins: [swc.vite()],
});
```

### Running Tests

```bash
# 단위 + E2E
pnpm test

# 단위 테스트만
vitest run

# E2E 테스트만
vitest run --config test/vitest.e2e-config.ts
```

## Global Setup (vitest.globalSetup.ts)

```typescript
import { MikroORM } from '@mikro-orm/core';

import { TestSeeder } from './mikro-orm.seeders';

export async function setup(): Promise<void> {
  const mikroOrm = await MikroORM.init();
  await mikroOrm.schema.ensureDatabase();
  await mikroOrm.schema.updateSchema();
  await mikroOrm.schema.clearDatabase();
  await mikroOrm.seeder.seed(TestSeeder);
  await mikroOrm.close();
}
```
