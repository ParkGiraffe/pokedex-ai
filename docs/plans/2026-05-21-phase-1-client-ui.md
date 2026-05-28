# Phase 1 — 스마트누오 클론 UI 구현 계획

> 기반 spec: `docs/specs/2026-05-21-phase-1-client-ui-outline.md` (2026-05-21 확정)
> 선행: Phase 0 완료(`@pokedex-agent/pokedex-core` 동작, 49 테스트 통과)

## 목표

`apps/client` (React + Vite) 4페이지(계산기·스피드·도감·파티빌더)를 만든다. 모든 결정론적 계산은 `@pokedex-agent/pokedex-core`를 호출한다. 각 페이지에 "Claude에 분석 요청"(클립보드 export) + "Claude 답변 붙여넣기"(parse) 양방향 슬롯을 둔다. 9세대 SV 싱글 한정, 한국어 UI.

## 스택 (spec §2·§3·§7 확정)

React 19, Vite 8, TypeScript 6, TanStack Router(코드 기반 라우팅), TanStack Query, Zustand(파티는 persist), Tailwind CSS 4(`@tailwindcss/vite`), CVA + tailwind-merge + clsx(`cn`), i18next + react-i18next(ko만), sonner(토스트), Vitest 4 + Testing Library + jsdom.

신규 의존성(모두 spec 명시 스택): `react`, `react-dom`, `@tanstack/react-router`, `@tanstack/react-query`, `zustand`, `tailwindcss`, `@tailwindcss/vite`, `class-variance-authority`, `clsx`, `tailwind-merge`, `i18next`, `react-i18next`, `sonner`, `vite`, `@vitejs/plugin-react`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@types/react`, `@types/react-dom`.

설치 주의: rolldown/esbuild 네이티브 바인딩 누락 시 `pnpm install --force` 1회.

## 디렉토리 (spec §4)

```
apps/client/
├── package.json, tsconfig.json, vite.config.ts, index.html
├── src/
│   ├── main.tsx, router.tsx, i18n.ts, index.css
│   ├── routes/        __root, index(계산기), speed, docs, party  (코드 기반 route 정의)
│   ├── pages/         calculator/ speed/ dex/ party/ (각 ui·model(store)·lib)
│   ├── features/      claude-bridge/ pokemon-picker/ stat-spread/ damage-result/
│   ├── common/        ui/(Button,Input,Select,Sheet,Card,Field) lib/(cn) 
│   └── locales/ko.ts
```

레이어 규칙(react.md): common → features → pages, 하위는 상위 미참조. `export default` 금지. 컴포넌트 PascalCase, 훅 use*, 그 외 kebab-case. 클래스는 `cn`, 변형은 `cva`.

## Task 분해

- **T1 스캐폴딩**: package.json·vite.config(react+tailwind v4 플러그인, vitest test 설정)·tsconfig·index.html·main.tsx·router.tsx(빈 4라우트 + __root 레이아웃)·i18n.ts·index.css(`@import "tailwindcss"`). 검증: `pnpm --filter client dev` 기동, `pnpm --filter client type-check` 통과, 4라우트 진입.
- **T2 common/ui**: `cn`(clsx+tailwind-merge), Button(cva), Input, NumberField, Select, Card, Sheet(사이드패널용), Toaster(sonner). 검증: type-check + 간단 렌더 테스트 1.
- **T3 claude-bridge**: `model/store.ts`(마지막 파싱 결과 공유), `ui/ExportButton`(serializeForClaude → clipboard → 토스트), `ui/PasteSidePanel`(Sheet + textarea + parseClaudeResponse → 성공 시 store 반영·실패 시 토스트+raw 유지), `ui/AppliedResult`(summary·details·actionable 표시). 검증: 표준 JSON 응답 paste → 반영 테스트.
- **T4 계산기 `/`**: 공격/방어 측 입력(종족 picker·기술 타입/위력·EV/IV/성격·랭크·도구배율·특성배율·테라·날씨·화상·급소) → `actualStatBlock`/`effectiveSpeed` 불필요, `calculateDamage` 호출 → 16롤 막대 + 결정력%(최대롤/HP) + 확정/난수 KO 표시. claude-bridge task=`battle-decision` 또는 전용. 검증: 통합 테스트 3(자속/상성/0배 반영).
- **T5 스피드 `/speed`**: 양측 종족값S+EV/IV/성격/랭크/도구/특성/마비/순풍/끈적네트/트릭룸 → `actualStat`(S)+`effectiveSpeed`+`fasterSide`. 검증: 테스트 3(랭크·순풍·트릭룸).
- **T6 도감 `/docs`**: 검색(`fuzzyPokemon`)·타입/세대 필터 → 종족 카드(타입·세대·약점 매트릭스 `typeEffectiveness` 18타입). 1025행은 기본 스크롤(실측 후 가상 스크롤 판단). 검증: 테스트 3(검색·필터·약점).
- **T7 파티빌더 `/party`**: 6슬롯 PartyMember 입력(picker·성격·도구·테라·기술4·EV/IV) → Party Zod 검증·약점 매트릭스·종합. `persist`(localStorage). claude task=`party-analysis`. 검증: 테스트 3(추가/검증/persist 직렬화).
- **T8 최종 검증**: `pnpm --filter client type-check`·`test`(페이지당 3+)·`dev` 기동 확인. 루트 `pnpm test`/`type-check` 전체 통과.

## 완료 조건 (spec §9)

- 4페이지 진입, 결정론적 계산이 pokedex-core 결과와 일치
- Export → 클립보드 마크다운+JSON 정확
- Paste → 표준 JSON 응답 UI 반영(테스트 1+)
- `pnpm --filter client type-check`·`test` 통과

## 유연성

스마트누오 실제 화면은 접근 불가 → 기능(계산기·스피드·도감·파티빌더) 동등성을 우선하고, 시각은 깔끔한 자체 디자인으로 구현한다. 라우팅은 코드 기반(파일 기반 codegen 회피). 메타 데이터·배틀 트래커는 비범위(Phase 2/4).
