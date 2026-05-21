---
name: check-all
description: Run lint, type-check, and tests across the entire monorepo (turbo). Use before marking work complete or before committing to confirm all apps still build and pass checks.
---

# check-all

모노레포 전체에 대해 lint, 타입체크, 테스트를 순차 실행한다.

## 실행 절차

1. 루트에서 다음을 순서대로 실행한다. 하나라도 실패하면 즉시 멈추고 원인을 리포트한다.

   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

2. 각 단계 결과를 사용자에게 명확히 보고:
   - 성공: 어떤 앱들이 통과했는지
   - 실패: 실패 위치(앱/파일/라인)와 에러 메시지 원문

## 주의

- `pnpm test`는 현재 `apps/server`에서만 유의미한 테스트를 실행한다 (Vitest unit + e2e 순차). 다른 앱은 test 스크립트가 없어 skip된다.
- `pnpm test`는 `NODE_ENV=test`와 `apps/server/.env.test`, 그리고 `mise run infra up --env test`로 기동된 DB/Redis가 필요할 수 있다. 사전 기동 상태를 확인한다.
- 단일 앱만 검증하고 싶을 땐 `pnpm --filter <client|server|console|mobile> lint` 처럼 필터를 사용한다.
