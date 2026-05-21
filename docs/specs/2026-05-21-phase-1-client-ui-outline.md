# Phase 1 — 스마트누오 클론 UI (윤곽 spec)

> **상태:** 확정 (2026-05-21, Phase 0 완료 후 재검토). §2를 실제 Phase 0 결과로 갱신했다. 이 spec 기준으로 Phase 1 plan을 작성한다.
> **유연성 원칙:** 이 spec은 현재 가정에 기반한 윤곽이다. Phase 0 구현 중 발견되는 사실(데이터 누락, 공식 보정, 스키마 변경, 라이브러리 호환성)에 따라 자유롭게 수정·재구성한다. 윤곽이 부정되더라도 죄책감 없이 갈아엎는다.

## 1. 목표

스마트누오(smartnuo.com)의 4페이지 UI(계산기·스피드·도감·파티빌더)를 React + Vite로 구현한다. 모든 결정론적 계산은 `@pokedex-agent/pokedex-core`를 그대로 호출하며, 각 페이지에 Claude paste 양방향 슬롯을 둔다. 9세대 SV 싱글배틀 한정.

## 2. Phase 0 결과 (확정 사실, 2026-05-21 완료)

- `@pokedex-agent/pokedex-core`가 동작하며 다음을 export 한다.
  - 데이터: `pokedex`, `pokedexByNo/Ko/En`
  - 조회: `findPokemon`, `findMove`, `findAbility`, `findItem`, `fuzzyPokemon`, `allMoves/allAbilities/allItems`
  - 공식(`formula` 네임스페이스): `calculateDamage`(16롤, 4096 모디파이어), `actualStat`/`actualStatBlock`, `NATURE_TABLE`, `typeEffectiveness`, `effectiveSpeed`/`fasterSide`
  - 직렬화: `serializeForClaude(task, payload)`, `parseClaudeResponse(text)`, `ClaudeResponseSchema`
  - 스키마: `PartyMember`, `PartyMemberObject`, `Party`, `BattleState`, `TYPE_NAMES`, `NATURE_NAMES` 등
- 데이터 JSON 6종이 `packages/pokedex-core/data/` 에 정착: `pokedex(1025)`, `types`, `moves(843)`, `abilities(276)`, `items(328)`, `natures(25)`. 모두 fetcher 멱등.
- `pokedex-core` 테스트 49개 통과. 데미지 30케이스는 본 구현 회귀 기준선으로 잠금(외부 smartnuo ±0 대조는 미수행 — 잔여 수동 항목).

### Phase 0에서 확정된 변경 (윤곽 대비)

- **성격명·보정**: `NATURE_NAMES`를 PokeAPI 공식 표기로 교정(개구쟁이·의젓·명랑·천진난만·조심·덜렁·얌전·건방·변덕·성실 등). 보정치는 `natures.json`에서 파생. UI 성격 선택지는 이 25개를 그대로 쓴다.
- **아이템 실명**: 돌격조끼(assault-vest), 구애머리띠/스카프/안경, 기합의띠, 생명의구슬 등 실제 한국어명 사용. "구애조끼"는 존재하지 않음.
- **데미지 입력 형태**: `calculateDamage`는 실수치(attack/defense)·basePower·moveType·attackerTypes·defenderTypes·테라·weatherBoost(1|1.5|0.5)·itemMultiplier·burned·critical을 받는다. UI는 종족값+EV/IV/성격/랭크/도구/특성을 입력받아 `actualStatBlock`/`effectiveSpeed`로 실수치를 만든 뒤 `calculateDamage`에 넘긴다.
- **런타임/설치 주의**: node 22.11/pnpm 10.23 환경(mise 핀 node24/pnpm10.23은 GitHub rate limit로 미설치). Vite 8/Vitest 4는 rolldown 네이티브 바인딩이 첫 설치에서 누락될 수 있어 `pnpm install --force` 1회가 필요하다. apps/client 도입 시 동일 주의.

위 사실에 맞춰 §4 구조·§5 흐름·§7 라이브러리를 확정한다. 추가로 가정이 깨지면 그 시점에 Phase 0를 수정한다.

## 3. 범위 · 비범위

**범위:**
- `apps/client` 생성 (p2z `apps/client/CLAUDE.md` 스택 그대로: React 19 + Vite 8 + TanStack Router + TanStack Query + Zustand + Tailwind 4 + Vitest + i18next)
- 4페이지 라우트 + 각 페이지의 입력 UI · 결과 표시
- 각 페이지에 "Claude에 분석 요청" 버튼(클립보드 export) + 사이드패널 "Claude 답변 붙여넣기"(`parseClaudeResponse` 호출)
- 모바일 대응(반응형, 토스트 사용)
- 한국어 UI (i18n 키는 있되 실제 리소스는 ko만 채움)

**비범위:**
- AI 추론 로직 (Phase 2~4)
- 메타 데이터 표시 (Phase 2 도입)
- 배틀 트래커 (Phase 4)
- 백엔드 서버
- 회원·저장(파티 빌드 로컬 저장 정도는 IndexedDB or localStorage로 1회성 — Zustand persist 미들웨어로 충분)

## 4. 핵심 컴포넌트 · 파일 구조 윤곽

```
apps/client/
├── package.json                  p2z client 의존성 + workspace:* pokedex-core
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── eslint.config.mjs
├── index.html
├── public/
└── src/
    ├── main.tsx
    ├── i18n.ts
    ├── index.css                 Tailwind entry
    ├── routes/                   TanStack Router 라우트 정의
    │   ├── __root.tsx
    │   ├── index.tsx             "/"  계산기
    │   ├── speed.tsx             "/speed"
    │   ├── docs.tsx              "/docs"
    │   └── party.tsx             "/party"
    ├── pages/
    │   ├── calculator/
    │   │   ├── ui/
    │   │   ├── model/            Zustand store
    │   │   └── lib/              데미지 계산 호출 어댑터
    │   ├── speed/
    │   ├── dex/
    │   └── party/
    ├── features/
    │   ├── claude-bridge/        export·paste 사이드패널 (전 페이지 공용)
    │   │   ├── ui/
    │   │   │   ├── ExportButton.tsx
    │   │   │   ├── PasteSidePanel.tsx
    │   │   │   └── AppliedHighlights.tsx
    │   │   ├── model/
    │   │   └── lib/
    │   ├── pokemon-picker/       종족·기술·도구·특성 자동완성 (퍼지)
    │   ├── stat-spread/          EV/IV/성격 입력 위젯
    │   └── damage-result/        16롤 결과 시각화
    ├── common/
    │   ├── ui/                   shadcn 스타일 (Button, Input, Select, Sheet, Toast)
    │   ├── icons/
    │   └── lib/                  clsx·tailwind-merge·cn 등
    └── locales/
        └── ko.ts
```

## 5. UX · 데이터 흐름

### 페이지별 핵심 UI

| 페이지         | 입력 영역 | 결과 영역 | Claude 슬롯 |
|--------------|---------|----------|-----------|
| 계산기 `/`     | 공격 측·방어 측 입력(종족·기술·EV·도구·특성·랭크·테라·필드·날씨·상태이상) | 16롤 데미지 막대 + 결정력 % 표시 | "이 매치업 분석" |
| 스피드 `/speed`| 양측 스피드 인풋(레벨·EV·IV·성격·랭크·도구·특성·필드·상태이상) | 최종 스피드 + 우선판정 | "스피드 상황 분석" |
| 도감 `/docs`   | 검색·타입 필터·세대 필터 | 종족 카드 (스탯 그래프·기술표·약점 매트릭스) | "이 종족 운용법" |
| 파티빌더 `/party` | 6슬롯, 각 슬롯에 모든 PartyMember 필드 | 파티 약점 매트릭스 + 종합 스탯 | "이 파티 분석" |

### Claude 양방향 흐름

1. **Export:** 페이지마다 우상단 "Claude에 분석 요청" 버튼. 클릭 시 `serializeForClaude(task, payload)` → `navigator.clipboard.writeText()` → 토스트로 "복사됐다. Claude 대화창에 paste".
2. **Paste:** 우측 슬라이드 사이드패널(Radix Sheet). textarea + "분석 결과 반영" 버튼. 클릭 시 `parseClaudeResponse(text)` → 성공 시 페이지 상태에 반영(추천 슬롯 하이라이트·약점 배지 추가·교체 제안 카드 노출). 실패 시 토스트로 사유 + raw 영역 유지.

## 6. 상태 관리 전략

각 페이지마다 Zustand store 하나. 페이지 간 공유는 안 함 (개인 도구라 단순화). 파티 빌더만 `persist` 미들웨어로 localStorage에 저장 (재방문 시 복원).

```
calculator/model/store.ts   useCalculatorStore
speed/model/store.ts        useSpeedStore
dex/model/store.ts          useDexStore (검색·필터 상태만)
party/model/store.ts        usePartyStore (persist)
```

`claude-bridge/model/store.ts` — paste된 응답의 마지막 결과를 모든 페이지에서 공유 (응답 hover 시 어디서 왔는지 확인 가능).

## 7. 라이브러리 결정 (변경 가능)

| 용도 | 후보 | 권장 |
|---|---|---|
| 다이얼로그·시트 | `@radix-ui/react-dialog`, `react-modal-sheet` | p2z와 동일하게 `react-modal-sheet` + Radix |
| 토스트 | `sonner` (p2z 채택) | sonner |
| 폼 검증 | `react-hook-form` + Zod | Zod 검증은 store에서 직접, RHF은 도입 안 함 (개인 도구 규모) |
| 차트(16롤 시각화) | `recharts`, `visx`, 자체 SVG | 자체 SVG (16개 막대라 단순) |
| 자동완성 | `cmdk` | cmdk (Radix·Tailwind와 잘 맞음) |

## 8. 위험 · 미해결 항목

| 항목 | 다룰 시점 |
|---|---|
| 도감 페이지에서 1025마리 가상 스크롤 (성능) | Phase 1 구현 중 실측 후 결정 (10000행 미만이라 기본 스크롤로도 OK 가능성) |
| 파티 빌더의 EV 슬라이더 UX (스마트누오는 숫자만 받음) | 스마트누오 본가 UI 우선 따라가고, 본인 사용감 보고 슬라이더 추가 결정 |
| Claude 응답 사이드패널이 좁은 모바일에서 가독성 | Sheet 컴포넌트 풀스크린 모드로 대응 |
| 페이지 간 파티 정보 공유 (계산기 ↔ 파티빌더) | YAGNI — 처음엔 각자 격리, 사용자 요구 생기면 도입 |

## 9. 완료 조건

- `pnpm --filter client dev` 로 4페이지 모두 진입 가능
- 각 페이지에서 결정론적 계산 결과가 스마트누오와 동일 (Phase 0 fixture 케이스를 UI에서도 검증)
- Export 버튼 → 클립보드에 정확한 마크다운+JSON 들어감
- Paste 사이드패널 → 표준 JSON 응답 받으면 UI에 반영 (테스트 케이스 1개라도)
- `pnpm --filter client type-check` 통과
- `pnpm --filter client test` (통합 테스트 페이지당 최소 3개) 통과

## 10. 유연성 노트 (앞 Phase 변경 대응)

이 spec은 다음과 같이 **자유롭게 갈아엎을 수 있다**:

- **Phase 0의 export.ts·parse.ts 시그니처가 바뀌면** → 사이드패널·버튼 호출부만 갈아끼우면 됨. Zustand store는 손대지 않아도 됨.
- **Phase 0에서 새로운 데이터(예: 종족별 약점 매트릭스 미리 계산본)가 생기면** → 도감 페이지의 약점 위젯이 즉시 그걸 사용. 추가 fetcher 없음.
- **메타 데이터(Phase 2 도입)가 들어오면** → 도감 페이지에 사용률 배지·파티 빌더에 "유사 빌드" 슬롯 추가. Phase 1 시점엔 자리만 비워둔다.
- **사용자가 4페이지 외 새 페이지(예: 트레이너 챌린지)를 요구하면** → routes 추가만 하면 됨. 도메인 분리가 잘 되어 있어 영향 최소.
- **TanStack Router 대신 React Router를 쓰고 싶어지면** → routes/ 디렉토리만 갈아엎으면 됨. 페이지 컴포넌트는 그대로.

## 11. 다음 Phase로 넘기는 결정 사항

Phase 1 구현 중 다음 사항을 기록해 Phase 2 brainstorming에 반영:

- 실제 작업해보니 가장 자주 쓰는 인풋 조합 (메타 데이터 우선순위에 반영)
- Claude paste 응답에서 가장 자주 누락되는 필드 (parse.ts 스키마 수정)
- 사이드패널 UX의 가독성 문제 (Phase 2의 응답 형식에 영향)
- 도감 페이지에서 어떤 정보를 가장 자주 클릭하는지 (Phase 3 매치업 분석 우선순위 결정)
