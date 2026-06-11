# pokedex-agent

박기린의 개인 **포켓몬 챔피언스 싱글배틀** 분석 도구. 데미지·스피드·매치업을 결정론으로
계산하는 웹앱에, Claude(Anthropic API)를 서버가 직접 호출하는 AI 추천을 결합했다.

메가진화·테라스탈이 공존하는 챔피언스 환경을 대상으로 하며, 모든 종족·기술·도구·특성
명칭은 PokeAPI 한국어 공식 표기를 따른다.

## 무엇을 하는가

데미지·스피드·매치업·배틀 계산은 전부 클라이언트에서 결정론으로 즉시 계산되고(무료·무제한),
AI 추천이 필요한 곳만 서버를 통해 Claude를 호출한다(로그인 + 일일 쿼터).

| 페이지 | 기능 |
|--------|------|
| **계산기** | 단일 기술 데미지. 테라·스텔라, 랭크업/다운, 화상, 날씨, 도구, 스크린(빛의장막·리플렉터) 반영. 데미지 범위와 확정/난수 N타 표기 |
| **스피드** | 두 포켓몬 실효 스피드 비교. 메가, 순풍, 마비, 끈적네트, 구애스카프, 트릭룸 반영 |
| **도감** | 1025마리 한국어 공식 표기. 이름·도감번호 검색, 타입·세대 필터, 페이지 직접 입력 |
| **파티빌더** | 6마리 파티 구성(노력 포인트 0~32). 타입 약점 분산 분석, 메가스톤 2개 이상 시 경고. 서버 프리셋 저장(무료 2/유료 20)·공유 링크 |
| **노력치 역산** | 내구·스피드·화력 목표를 만족하는 최소 노력 포인트 역산 |
| **매치업** | 6마리 중 3마리 선출 → 상대 공개분 대비 매트릭스 점수 → 선두 1·2·3순위 추천 |
| **매치업 매트릭스** | 내 팀×상대 팀 전체 상성표 그리드 |
| **배틀** | 실시간 의사결정. 생존 포켓몬 토글, 랭크·상태이상·메가·필드(스텔스록·압정·스크린·순풍) 반영, 선공 판정, 기술 vs 교체 추천 |
| **배틀 스크린샷** | 배틀 화면 스크린샷을 올리면 상황 해석·추천·주의점을 AI가 답변 |
| **전적** | 수동 배틀 일지 + 승률 통계(선발별·상대별) + 약점 상대 카운터 코칭 |
| **리더보드** | 공유 프리셋 복사수 순위(비로그인 열람) |
| **리빙 메타** | 전 사용자 전적 익명 집계 — 선발·상대 사용률과 승률, 기믹 분포 |

### AI 추천

AI 기능은 서버가 Anthropic API를 호출해 구조화 응답(JSON)으로 받는다. 전부 로그인 필수이며
호출 전에 일일 쿼터(무료 2/유료 100, KST 자정 리셋)를 원자적으로 소비한다.

- **파티 분석** — 파티의 장단점·약점·보완 슬롯을 한국 SV 커뮤니티 어휘로 분석
- **선두 추천** — 선출 3마리 중 결정론 점수로 1·2·3순위를 정하고, 근거·상대 응수를 설명
- **배틀 어드바이저** — 현재 액티브의 기술·교체 추천 (결정론 계산 + 자연어 해석)
- **배틀 스크린샷 조언** — 배틀 화면 스크린샷을 경량 비전 모델로 해석해 추천·주의점 답변
- **파티 가져오기** — 게임 스크린샷에서 파티를 인식 (아래 절 참고)

추천 품질을 위한 2겹 방어가 있다.

1. **데이터 주입** — 상대 종족의 실측 흔한 특성·기술을 검증된 한국명으로 프롬프트에 넣어
   모델이 추측·음역할 여지를 없앤다.
2. **출력 검증** — 모델이 응답에 쓴 모든 고유명사를 신고하게 하고, 명칭 사전과 대조해
   음역·존재하지 않는 명칭이 있으면 1회 교정 재시도한다.

### 파티 가져오기

게임 화면 스크린샷(여러 장 가능)을 올리면 Claude 비전으로 종족·도구·특성·성격·기술·
노력치를 인식해 파티빌더 형식으로 채운다. 성격은 스탯 옆 ↑/↓ 화살표로 추론한다.

## 시작

### 1. 환경변수 설정

```bash
cp apps/server/.env.example apps/server/.env.development
cp packages/data-fetchers/.env.example packages/data-fetchers/.env
```

`apps/server/.env.development`에 키 채우기 (테스트는 같은 방법으로 `.env.test`):

- `ANTHROPIC_API_KEY` — AI 추천과 파티 이미지 인식에 필요. [console.anthropic.com](https://console.anthropic.com)에서 발급.

`packages/data-fetchers/.env` (데이터 수집 스크립트를 직접 돌릴 때만):

- `PKMNCHAMPS_ANON_KEY` — 챔피언스 데이터 수집(`pnpm fetch:champions*`)에만 필요. pkmnchamps.com 개발자도구 Network 탭의 Supabase 요청 헤더 `apikey` 값.

### 2. 의존성 설치 + 인프라 + 개발 서버 기동

```bash
mise install                              # node 24 + pnpm 10
pnpm install
mise run infra up --env development       # Postgres(docker, 포트 5435)
pnpm dev                                  # client(Vite 5173) + server(NestJS 3007) 병렬 기동
```

브라우저에서 `http://localhost:5173` 접속. 클라이언트는 `/advisor` 요청을 서버(3007)로
프록시하므로 추천·이미지 인식이 같은 출처에서 동작한다.

## 기술 스택

- **모노레포** — pnpm workspace + Turbo, mise(node 24)
- **클라이언트** — React + Vite, TanStack Router/Query, Zustand, Tailwind + shadcn 스타일
- **서버** — NestJS 11(Express) + MikroORM/PostgreSQL, 내부 로그인+JWT, Anthropic SDK(`messages.parse` + zodOutputFormat)
- **도메인** — `packages/pokedex-core` 결정론 라이브러리(데이터·공식·타입), `packages/battle-engine` 배틀 상태·데미지 엔진, `packages/data-fetchers` PokeAPI/챔피언스 수집

## 데이터 정책

모든 데이터는 PokeAPI·챔피언스 공식 소스에서 스크립트로 가져온다. 종족·기술·도구·특성
명칭은 한 글자도 손으로 입력하지 않으며, 명칭의 단일 출처는 `packages/pokedex-core/data`의
`pokedex.json`·`moves.json`·`abilities.json`·`items.json`이다.

## 상세 설계

한국 SV 커뮤니티 어휘 사전은 `docs/lexicon.md` 참고. 신규 기능 로드맵은 `CLAUDE.md`의 "활성 로드맵" 참고.
