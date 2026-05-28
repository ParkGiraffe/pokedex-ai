# pokedex-agent

박기린의 개인 **포켓몬 챔피언스 싱글배틀** 분석 도구. 데미지·스피드·매치업을 결정론으로
계산하는 웹앱에, Claude(Anthropic API)를 서버가 직접 호출하는 AI 추천을 결합했다.

메가진화·테라스탈이 공존하는 챔피언스 환경을 대상으로 하며, 모든 종족·기술·도구·특성
명칭은 PokeAPI 한국어 공식 표기를 따른다.

## 무엇을 하는가

웹앱은 6개 페이지로 구성된다. 데미지·스피드·매치업·배틀 계산은 전부 클라이언트에서
결정론으로 즉시 계산되고, AI 추천이 필요한 곳만 서버를 통해 Claude를 호출한다.

| 페이지 | 기능 |
|--------|------|
| **계산기** | 단일 기술 데미지. 테라·스텔라, 랭크업/다운, 화상, 날씨, 도구, 스크린(빛의장막·리플렉터) 반영. 데미지 범위와 확정/난수 N타 표기 |
| **스피드** | 두 포켓몬 실효 스피드 비교. 메가, 순풍, 마비, 끈적네트, 구애스카프, 트릭룸 반영 |
| **도감** | 1025마리 한국어 공식 표기. 이름·도감번호 검색, 타입·세대 필터, 페이지 직접 입력 |
| **파티빌더** | 6마리 파티 구성(노력 포인트 0~32). 타입 약점 분산 분석, 메가스톤 2개 이상 시 경고 |
| **매치업** | 6마리 중 3마리 선출 → 상대 공개분 대비 매트릭스 점수 → 선두 1·2·3순위 추천 |
| **배틀** | 실시간 의사결정. 생존 포켓몬 토글, 랭크·상태이상·메가·필드(스텔스록·압정·스크린·순풍) 반영, 선공 판정, 기술 vs 교체 추천 |

### AI 추천

세 가지 추천은 서버가 Anthropic API를 호출해 구조화 응답(JSON)으로 받는다.

- **파티 분석** — 파티의 장단점·약점·보완 슬롯을 한국 SV 커뮤니티 어휘로 분석
- **선두 추천** — 선출 3마리 중 결정론 점수로 1·2·3순위를 정하고, 근거·상대 응수를 설명
- **배틀 어드바이저** — 현재 액티브의 기술·교체 추천 (결정론 계산 + 자연어 해석)

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
cp apps/server/.env.example apps/server/.env
cp packages/data-fetchers/.env.example packages/data-fetchers/.env
```

`apps/server/.env`에 키 채우기:

- `ANTHROPIC_API_KEY` — AI 추천과 파티 이미지 인식에 필요. [console.anthropic.com](https://console.anthropic.com)에서 발급.

`packages/data-fetchers/.env` (데이터 수집 스크립트를 직접 돌릴 때만):

- `PKMNCHAMPS_ANON_KEY` — 챔피언스 데이터 수집(`pnpm fetch:champions*`)에만 필요. pkmnchamps.com 개발자도구 Network 탭의 Supabase 요청 헤더 `apikey` 값.

### 2. 의존성 설치 + 개발 서버 기동

```bash
mise install     # node 24 + pnpm 10
pnpm install
pnpm dev          # client(Vite 5173) + server(Fastify 3007) 병렬 기동
```

브라우저에서 `http://localhost:5173` 접속. 클라이언트는 `/advisor` 요청을 서버(3007)로
프록시하므로 추천·이미지 인식이 같은 출처에서 동작한다.

## 기술 스택

- **모노레포** — pnpm workspace + Turbo, mise(node 24)
- **클라이언트** — React + Vite, TanStack Router/Query, Zustand, Tailwind + shadcn 스타일
- **서버** — Fastify + tsx watch, Anthropic SDK(`messages.parse` + zodOutputFormat)
- **도메인** — `packages/pokedex-core` 결정론 라이브러리(데이터·공식·타입), `packages/data-fetchers` PokeAPI/챔피언스 수집

## 데이터 정책

모든 데이터는 PokeAPI·챔피언스 공식 소스에서 스크립트로 가져온다. 종족·기술·도구·특성
명칭은 한 글자도 손으로 입력하지 않으며, 명칭의 단일 출처는 `packages/pokedex-core/data`의
`pokedex.json`·`moves.json`·`abilities.json`·`items.json`이다.

## 상세 설계

Phase별 디자인 문서는 `docs/specs/`, 한국 SV 커뮤니티 어휘 사전은 `docs/lexicon.md` 참고.
