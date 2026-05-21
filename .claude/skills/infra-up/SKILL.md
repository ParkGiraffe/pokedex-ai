---
name: infra-up
description: Start local infrastructure (Postgres/Redis etc. via Docker Compose) for this repo using the mise task. Use when the user needs DB/Redis running to develop, seed, run migrations, or execute tests.
---

# infra-up

로컬 인프라(Postgres/Redis 등)를 `mise run infra up` 으로 기동한다.

## 사용법

환경(env)은 반드시 하나 지정한다. `apps/server/.env.<env>` 파일이 있어야 동작한다.

```bash
mise run infra up --env development   # 개발용
mise run infra up --env test          # 테스트 실행 전
mise run infra up --env production    # 실 배포 환경 재현이 필요할 때만
```

## 실행 순서

1. 사용자에게 어떤 env가 필요한지 확인한다 (기본값은 `development`).
   - 테스트 실행 지원이 목적이면 `test`.
   - 개발/마이그레이션/시더 작업이면 `development`.
2. `apps/server/.env.<env>`가 존재하는지 먼저 확인한다. 없으면 중단하고 사용자에게 안내.
3. `mise run infra up --env <env>` 실행.
4. 종료는 `mise run infra down --env <env>` (필요 시).

## 주의

- 여러 env를 동시에 띄우면 포트 충돌 위험. 한 env만 유지한다.
- 서버/시더/마이그레이션은 반드시 `NODE_ENV=<env>` 환경에서 실행한다.
