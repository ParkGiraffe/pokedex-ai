# apps/server — Claude 컨텍스트 가이드

포켓몬 챔피언스 분석 웹앱의 백엔드. **NestJS + Express**. Anthropic API 직접 호출(추천·이미지 OCR), `battle-engine`·`pokedex-core` 도메인 연산 제공.

## 상태

**Phase A(Fastify→NestJS 전환)·Phase B(인증·DB) 완료(2026-06-04).** 8개 도메인 엔드포인트 + 계정/내부 로그인(이메일+비번)/JWT + MikroORM/Postgres 동작. 전체 로드맵: `~/.claude/plans/6-27-harmonic-lecun.md`. 다음은 Phase C(프리셋 티어).

## 기술 스택

| 분류        | 기술                         |
|-----------|----------------------------|
| Language  | TypeScript                 |
| Framework | NestJS 11 (platform-express) |
| Build     | nest build (SWC, CommonJS) |
| Test      | Vitest + unplugin-swc (실 DB) |
| DB        | PostgreSQL 18 + MikroORM 7 (docker compose) |
| Auth      | 내부 로그인 + @nestjs/jwt   |
| AI        | @anthropic-ai/sdk          |

Redis·Queue는 계획에 없음(p2z 템플릿의 Redis/Bull/Throttler는 도입 안 함). 새 패키지는 사용자 승인 후.

## 구조

```
src/
├── main.ts              부트스트랩(listen). 앱 생성은 app.factory로 분리(테스트가 listen 없이 재사용)
├── app.factory.ts       createApp: NestExpress, 12MB body, 전역 예외 필터, CORS
├── app.module.ts        Advisor·Battle·Import 모듈 + HealthController
├── dto.ts               요청 Zod 스키마(pokedex-core Party·BattleState 재사용) + 추론 타입
├── common/
│   ├── zod-validation.pipe.ts   Zod 스키마로 @Body 검증(class-validator 대신 — 도메인 스키마가 Zod라 재사용)
│   └── error.filter.ts          전역 필터: 응답을 { error: message }로(기존 Fastify 계약 유지)
├── advisor/             /analyze-party·/matchup-leadrec·/battle-advice (Sonnet, 2패스 보정 보존)
├── import/              /import-party (Opus 비전). 순수 함수 buildImportResult·mergeMembers export 유지
├── battle/              /team-select·/decide·/counter (battle-engine 로컬 연산)
├── health/              /health → { ok: true }
├── mikro-orm.config.ts  Postgres 설정(env via dotenv, 엔티티 명시 배열, ReflectMetadataProvider)
├── users/               User 엔티티(uuidv7, provider·tier enum) + UsersService(EntityManager)
├── presets/             Preset 엔티티(party jsonb) + CRUD. 티어 캡(무료2/유료20) em.transactional로 강제
└── auth/                내부 로그인 + JWT (헥사고날 포트/어댑터)
    ├── domain/          포트: AuthProvider(전략)·PasswordHasher·TokenService — lib import 없음
    ├── application/     AuthService — 포트에만 의존, provider 레지스트리로 login 분기
    ├── infrastructure/  InternalAuthProvider·ScryptPasswordHasher(node:crypto)·JwtTokenService
    └── auth.controller·auth.guard  /auth/register·login·me + JwtAuthGuard + CurrentUserId
```

라우트 경로는 기존 클라이언트 계약 유지를 위해 `v{n}/` 버저닝 없이 동일 경로 유지(버저닝은 클라 동시 변경이 필요해 추후). POST 핸들러는 `@HttpCode(200)`로 Fastify 기본 200 상태 보존.

## 핵심 도메인(이식 시 로직 보존 필수)

- **AI 추천** — `advisor/advisor.service.ts`: `serializeForClaude` + `ClaudeResponseSchema` + 미검증 한국어 명사 발견 시 **보정 2차 콜**. 모델 추천 Sonnet 4.6, OCR Opus 4.7. 임의 격하 금지(Haiku는 한국 종족·기술명 fabricate).
- **이미지 import** — `import/import.service.ts`: Opus 비전. 데이터 사전은 `@pokedex-agent/pokedex-core/node`의 `DATA_DIR`로 경로 해석(컴파일·재배치에도 안전). 배틀 스크린샷 조언용 경량 비전(Sonnet)은 추후 신설.
- **인증·쿼터(Phase B~D)** — Anthropic 호출 4개 엔드포인트에 JWT 가드 + 호출 전 일일 쿼터 소비 예정.

## 워크스페이스 패키지 빌드(중요)

`pokedex-core`·`battle-engine`는 raw `.ts`가 아니라 **tsup로 번들된 ESM dist를 export**한다(컴파일된 NestJS가 소비 가능하도록). 따라서 이들을 수정하면 소비 측에서 쓰기 전 **빌드가 필요**하다. turbo가 `type-check`·`test`·`build`에서 `^build`로 선행 빌드하지만, `dev`는 선행 빌드가 없으니 먼저 `pnpm build` 한 번 필요. core는 브라우저 안전한 메인 엔트리와 node 전용 `./node` 서브패스(`DATA_DIR`)로 분리돼 있다.

## 인증 설계 원칙(라이브러리 비결합)

새 로그인 방식(카카오·네이버)은 **`AuthProvider` 포트를 구현한 어댑터를 추가하고 `AuthModule`의 `AUTH_PROVIDERS` 배열에 넣기만** 하면 된다. 해시(scrypt)·토큰(JWT)·DB도 포트 뒤에 있어 교체 시 어댑터만 바꾼다. `AuthService`·도메인은 구체 라이브러리를 모른다 — application에서 @nestjs/jwt·MikroORM 직접 호출 금지.

## 작업 완료 조건

테스트·dev는 Postgres가 떠 있어야 한다(`mise run infra up --env test` 또는 `--env development`, 한 번에 한 env). 포트 5435.

```bash
mise run infra up --env test
pnpm --filter server type-check && pnpm --filter server build && pnpm --filter server test
```

### DB 스키마 변경

dev/test는 부팅 시 `schema.update()`로 자동 동기화된다. 운영용 마이그레이션:

```bash
NODE_ENV=development pnpm --filter server migration:create
```

## 외부 참조

NestJS·MikroORM 패턴은 `/Users/bag-yoseb/Desktop/Project/github/p2z`의 `apps/server`를 판박이로 따른다(단 p2z엔 packages/가 없어 워크스페이스 패키지 빌드 방식은 본 repo가 독자적). 관련 스킬: `nest-mikro-orm-service`·`nest-guard-decorator`·`dto-response`·`infra-up`·`testing-vitest`.
