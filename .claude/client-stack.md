# 웹앱 (`apps/client`) 기술 스택

> 출처: `/Users/bag-yoseb/Desktop/Project/github/p2z/apps/client/CLAUDE.md`
> 이 프로젝트의 `apps/client`는 동일한 스택을 사용한다.

| 분류           | 기술              |
|--------------|-----------------|
| Language     | TypeScript      |
| Framework    | React           |
| Build        | Vite            |
| Router       | TanStack Router |
| Remote State | TanStack Query  |
| Local State  | Zustand         |
| Styling      | Tailwind CSS    |
| i18n         | i18next         |
| Test         | Vitest          |

# 디렉토리 구조

```
apps/client/src/
├── pages/         라우트 단위 페이지 (battle·battle-vision·calculator·dex·ev-calc·leaderboard·log·
│                  matchup·matchup-matrix·meta·party·shared-preset·speed)
├── features/      도메인별 기능 모듈 (lib·model·ui로 세분화)
├── common/        공통 (icons·lib·ui)
├── routes/        TanStack Router 라우트 정의
├── locales/       i18next 리소스
├── i18n.ts
├── main.tsx
└── index.css
```

# 검증 도구

- ESLint (`simple-import-sort`, `tailwindcss-categorized`, `unused-imports`, `react-hooks`)
- Prettier (`prettier-plugin-tailwindcss`)
- Vitest + Testing Library
- TypeScript 6 (`tsc --noEmit`)

# 데이터 의존

- 도감/공식 계산은 `@pokedex-agent/pokedex-core` 패키지를 import.
- 외부 HTTP 호출은 `apps/client`에서 직접 하지 않는다 (Phase 0 데이터는 빌드 타임에 정적 JSON으로 포함).
