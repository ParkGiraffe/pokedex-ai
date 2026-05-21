# 2026-05-21 — pokedex-agent 파운데이션 디자인

> 상태: 브레인스토밍 합의 (사용자 승인 완료)
> 범위: 전체 아키텍처 윤곽 + Phase 0 (데이터 파운데이션) 상세
> 다음 단계: 이 문서를 사용자가 리뷰한 뒤 `writing-plans` 스킬로 Phase 0 구현 계획 작성

## 0. 배경

박기린(op5321)이 포켓몬 SV 싱글랭크 배틀을 할 때 옆에서 도와주는 개인 도구. 스마트누오(smartnuo.com)의 기능을 모두 가지면서, 거기에 없는 **AI 분석 4종**(파티 진단·매치업 추천·실시간 의사결정·약점 보완)을 더한다.

스마트누오는 한국 포켓몬 스트리머 "눈파티"가 만든 9세대 SV 싱글배틀 전용 결정론적 계산기·도감·파티 빌더 웹앱이다. 이미 잘 돌아가지만 AI 분석이 없다.

## 1. 합의된 핵심 결정

| 항목               | 결정 | 근거 |
|------------------|---|----|
| AI 에이전트 형태       | Claude Code 대화형 (개인 도구) | 별도 LLM 백엔드 운영 없음, 가장 가벼움 |
| 게임 범위           | 9세대 SV 한정 (스칼렛/바이올렛 + DLC) | 현재 랭크 환경, 데이터 가장 완비 |
| 메타 데이터          | 포함 (Pokemon Home 사용률 + 시즌별 인기 빌드 단발 수집) | AI 분석 품질 천장 결정 |
| 골격                 | pnpm + turbo monorepo (p2z 판박이) | 컨벤션 일치, 향후 확장 여지 |
| 웹앱 ↔ Claude 연결   | 클립보드 양방향 paste | 의존성 0, 마찰 최소 |
| 모든 모델            | Opus | 사용자 명시 |
| 데이터 소스           | PokeAPI v2 (`pokeapi.co`) | 한국어 공식 표기 일관, 1025마리 검증 완료 |

## 2. 아키텍처 전체 그림

```
┌────────────────────────────────────────────────────────────────┐
│  pokedex-agent  (pnpm + turbo monorepo, p2z 컨벤션 판박이)       │
│                                                                │
│  apps/                                                         │
│   └─ client/         React + Vite 웹앱 (스마트누오 클론 UI)       │
│       ├─ pages/      계산기·스피드·도감·파티빌더 4페이지           │
│       └─ features/   각 기능별 model·ui·lib                     │
│                                                                │
│  packages/                                                     │
│   ├─ pokedex-core/   결정론적 라이브러리 (어디서든 import)        │
│   │   ├─ data/       1025마리·기술·특성·도구 한국어 JSON          │
│   │   ├─ formula/    데미지·스피드 SV 공식 (순함수)               │
│   │   ├─ types/      Zod 스키마                                 │
│   │   └─ export/     Claude paste용 직렬화 + 응답 파싱           │
│   │                                                            │
│   └─ data-fetchers/  PokeAPI 수집 스크립트                       │
│                                                                │
│  docs/                                                         │
│   ├─ specs/          Phase별 디자인 문서                         │
│   └─ lexicon.md      한국 SV 커뮤니티 어휘 사전                   │
│                                                                │
│  CLAUDE.md           새 Claude 세션 컨텍스트 복원 지시            │
└────────────────────────────────────────────────────────────────┘

           ↕ 클립보드 양방향 paste

┌────────────────────────────────────────────────────────────────┐
│  Claude Code (Opus)                                            │
│   - 웹앱 → 클립보드 (마크다운+JSON) → Claude paste              │
│   - Claude 답변 끝 JSON 코드블록 → 사용자 복사 →               │
│     웹앱 사이드패널에 paste → Zod 검증 → UI 반영                │
└────────────────────────────────────────────────────────────────┘
```

## 3. 컴포넌트 책임 분담

### `packages/pokedex-core/` — 게임 룰의 진실

순수 TypeScript. UI/네트워크/스토리지 의존 0.

| 모듈        | 책임 | 외부 의존 |
|-----------|---|------|
| `data/`   | 1025마리·기술·특성·도구·타입 한국어 JSON (fetcher 산출물, 정적 import) | 없음 |
| `formula/`| SV 데미지 공식, 스피드 계산, 상성 배율, 랭크 보정 — 모두 순함수 | 없음 |
| `types/`  | `Pokemon`, `Move`, `Ability`, `Item`, `Party`, `PartyMember`, `BattleState` Zod 스키마 | `zod` |
| `lookup/` | 한글명·영문명·도감번호로 종족·기술·도구 조회 (in-memory 인덱스) | 없음 |
| `export/` | `BattleState` → Claude paste용 마크다운+JSON 직렬화, 응답 파싱 | `zod` |

### `packages/data-fetchers/` — PokeAPI 수집기

| 스크립트                  | 출력 |
|-----------------------|--------|
| `fetch-pokedex.ts`    | `pokedex-core/data/pokedex.json` |
| `fetch-moves.ts`      | `pokedex-core/data/moves.json` |
| `fetch-abilities.ts`  | `pokedex-core/data/abilities.json` |
| `fetch-items.ts`      | `pokedex-core/data/items.json` |
| `fetch-types.ts`      | `pokedex-core/data/types.json` |
| `fetch-all.ts`        | 위 5개 일괄 실행 |

`pnpm --filter data-fetchers fetch-all` 한 줄로 데이터 갱신. 멱등.

### `apps/client/` — 스마트누오 클론 UI

| 페이지              | 라우트       | 사용 모듈 |
|------------------|------------|--------|
| 계산기            | `/`         | `pokedex-core/formula/damage`, `lookup` |
| 스피드 비교       | `/speed`    | `pokedex-core/formula/speed`, `lookup` |
| 도감              | `/docs`     | `pokedex-core/data`, `lookup` |
| 파티 빌더         | `/party`    | `pokedex-core/types` (Party Zod 스키마) |

각 페이지는 Zustand로 자기 상태만 들고, `pokedex-core` 순함수를 호출. 서버 호출 없음.

각 페이지 우상단에 두 개 영역:
1. **"Claude에 분석 요청"** 버튼 → 현재 상태를 `serializeForClaude()` → 클립보드 복사 + 안내 토스트
2. **"Claude 답변 붙여넣기"** 사이드패널 → paste 영역 + 파싱 결과 미리보기 + "이 결과를 반영" 버튼

## 4. 데이터 흐름 (3 시나리오)

### 시나리오 A — 파티 분석

```
1. 사용자: /party 에서 6마리 입력
2. "Claude에 파티 분석 요청" 클릭
3. 클립보드:
   ## 작업: 파티 분석
   ## 파티: (6마리 상세)
   ## 요청:
   - 장점·약점 분석
   - 어떤 픽이 견제 필요한지
   - 보완 슬롯 제안
4. Claude Code에 paste
5. Claude 답변 끝에 JSON 코드블록 (```json {...} ```)
6. 사용자가 JSON 블록 복사 → 웹앱 사이드패널에 paste
7. 웹앱이 Zod 검증 → 추천 슬롯·하이라이트·경고 UI 표시
```

### 시나리오 B — 매치업 추천

내 파티 + 상대 파티(공개분) → 선두 우선순위 + 이유.

### 시나리오 C — 실시간 의사결정

배틀 트래커 모드에서 현재 필드 상태·HP·랭크·날씨·필드·남은 멤버 → 다음 턴 옵션별 데미지·확률.

## 5. Claude 응답 표준 포맷

모든 분석 응답은 자연어 설명 뒤에 **표준 JSON 코드블록**을 반드시 포함한다.

```json
{
  "task": "party-analysis" | "matchup-leadrec" | "battle-decision",
  "summary": "사람이 읽을 한 줄 요약",
  "details": [
    { "kind": "strength" | "weakness" | "warning" | "recommendation",
      "target": "어느 슬롯·어느 픽에 적용",
      "text": "한국 SV 어휘로 작성된 본문",
      "evidence": { "damage": "...", "speed": "...", "meta": "..." }
    }
  ],
  "actionable": [
    { "kind": "swap-slot" | "change-tera" | "change-move" | "change-item",
      "slot": 1, "from": "...", "to": "...", "reason": "..." }
  ]
}
```

`pokedex-core/export/parse.ts`가 이 스키마를 Zod로 검증한다.

## 6. Phase 0 산출물 (이번 사이클 구현 대상)

```
packages/pokedex-core/
├── data/
│   ├── pokedex.json      이미 .claude/data/pokedex.json 에 검증됨, 이동만
│   ├── moves.json        SV에서 사용 가능한 기술 전체
│   ├── abilities.json    특성 전체 (한국어명·효과)
│   ├── items.json        SV 도구 (한국어명·효과)
│   ├── types.json        18타입 + 상성 매트릭스
│   └── meta-{season}.json 시즌별 사용률·인기 빌드 (수기 갱신, Phase 2 때 시작)
│
├── src/
│   ├── types.ts          Zod 스키마
│   ├── lookup.ts         한글명/영문명/도감번호 빠른 조회
│   ├── formula/
│   │   ├── damage.ts     SV 데미지 공식 (테라스탈·스텔라 포함)
│   │   ├── speed.ts      스피드 계산 (랭크·도구·특성·필드)
│   │   ├── stat.ts       실수치 계산 (EV/IV/성격)
│   │   └── matchup.ts    타입 상성 배율
│   ├── export.ts         serializeForClaude(task, state)
│   └── parse.ts          parseClaudeResponse(text) → Zod 검증
│
└── test/
    ├── damage.spec.ts    도메인 언어 테스트
    ├── speed.spec.ts
    └── export.spec.ts
```

### Phase 0 완료 조건

- `pnpm --filter pokedex-core test` 통과
- 데미지 공식: Phase 0 구현 중 스마트누오와 Pokemon Showdown 양쪽에서 동일 입력으로 비교한 케이스를 모아 `test/fixtures/damage-cases.json`으로 저장. 최소 30케이스 (자속·테라스탈·랭크·도구·날씨·필드·재앙기 조합 망라). 모두 ±0 일치.
- 스피드 공식: 5단계 랭크·끈적끈적네트·순풍·트릭룸·부스트에너지·날씨 가속 특성 모두 통과
- export/parse 라운드트립: 임의 BattleState → JSON → 파싱 → 동일 BattleState
- 데이터 fetcher가 멱등 (두 번 돌려도 git diff 없음)

## 7. 에러 처리

| 지점                                  | 실패 시 동작 |
|-------------------------------------|---|
| `parseClaudeResponse` 가 스키마 미스       | 토스트 "Claude 응답 형식 어긋남" + 원문 보존 + raw 편집 영역 |
| 사용자가 모르는 종족·기술·도구 입력             | 입력란 빨간 보더 + fuzzy 후보 3개 자동완성 |
| 데미지/스피드 입력 누락                       | 누락 필드를 0이 아닌 `null`로 유지, "필수 입력 누락" 명시 |
| fetcher PokeAPI 실패                  | 지수 백오프 4회 재시도, 그래도 실패면 종료 코드 1 (직전 데이터 보존) |
| paste 응답에 알 수 없는 한글명             | `unknownNames: string[]` 채워서 UI 배지 표시 |

## 8. 테스트 전략

### `packages/pokedex-core`
Vitest 단위 테스트. 도메인 언어 제목.

예시:
- `"자속 보정이 1.5배로 적용된다"`
- `"테라스탈 후 자속 + 원본 자속이 만나면 2.0배가 된다"`
- `"맹공의안경 도구는 특수기 데미지를 1.2배 한다"`
- `"스피드 동률이면 50%로 표시한다"`
- `"트릭룸 상태에선 느린 쪽이 먼저 행동한다"`

### `apps/client`
Testing Library + Vitest. 페이지별 통합 테스트.

E2E 없음 (개인 도구 규모).

## 9. 운영 흐름 (다음 세션부터)

1. `cd /Users/bag-yoseb/Desktop/Project/personal/pokedex-agent && claude`
2. 새 Claude(Opus)가 `CLAUDE.md` → `.claude/*.md` → 이 spec 읽음
3. `writing-plans` 스킬로 Phase 0 구현 계획 작성
4. Phase 0 구현 → 검증 → 커밋
5. Phase 1 brainstorming → ... → 반복

## 10. 위험·미해결 (다음 Phase 때 정함)

| 항목 | 처리 시점 |
|---|---|
| Pokemon Home 한국 시즌별 사용률 수집 방법 (공식 API 없음) | Phase 2 brainstorming |
| Smogon 한국어화 누락 픽 (한국 메타와 다름) | Phase 3 brainstorming |
| Phase 4 의사결정 시 게임 트리 탐색 깊이·확률 모델 | Phase 4 brainstorming |

## 11. 외부 참조

- 스마트누오 본가: https://smartnuo.com/
- p2z 컨벤션: `/Users/bag-yoseb/Desktop/Project/github/p2z/CLAUDE.md`
- PokeAPI v2 문서: https://pokeapi.co/docs/v2

## 12. 부산물 (이 brainstorming 세션에서 미리 만든 것)

- `.claude/data/pokedex.json` — 1025마리 한국어 도감 (PokeAPI 수집 검증 완료, 2026-05-21). Phase 0 구현 시 `packages/pokedex-core/data/pokedex.json`으로 이동.
- 1차 수집 검증은 Python(`urllib + ThreadPoolExecutor`)으로 수행했으나, 본 프로젝트의 fetcher는 TypeScript로 재작성한다 (`packages/data-fetchers/`). 이유: monorepo 안에서 같은 Zod 스키마(`pokedex-core/types`)로 검증·직렬화하면 손편집 여지가 사라진다.
