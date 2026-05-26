# pokedex-agent

박기린의 개인 포켓몬 SV 싱글배틀 도구. 스마트누오(smartnuo.com) 기능을 모두 포함한 웹앱에 Claude Code 대화형 AI 분석을 결합했다.

## 무엇을 하는가

| 기능                              | 어디서      |
|--------------------------------|----------|
| 데미지 계산기 (테라·스텔라 포함)         | 웹앱       |
| 스피드 비교                         | 웹앱       |
| 도감 (1025마리 한국어 공식 표기)       | 웹앱       |
| 파티 빌더 (6마리, 9세대 SV)            | 웹앱       |
| 파티 장단점 분석                    | Claude Code 대화 |
| 매치업 선두 추천                    | Claude Code 대화 |
| 실시간 배틀 의사결정 (기술 vs 교체) | Claude Code 대화 |

웹앱과 Claude 사이는 **클립보드 양방향 paste**로 연결된다. 자동 IPC 없음.

## 시작

### 1. 환경변수 설정

```bash
cp apps/server/.env.example apps/server/.env
cp packages/data-fetchers/.env.example packages/data-fetchers/.env
```

`.env` 파일에 실제 키 채우기:
- `ANTHROPIC_API_KEY` — 파티 이미지 OCR용. [console.anthropic.com](https://console.anthropic.com)에서 발급.
- `PKMNCHAMPS_ANON_KEY` — 챔피언스 데이터 수집 스크립트(`pnpm fetch:champions*`)에만 필요. pkmnchamps.com 개발자도구 Network 탭에서 Supabase 요청 헤더 `apikey` 복사.

### 2. 의존성 설치 + 개발 서버 기동

```bash
mise install     # node 24 + pnpm 10
pnpm install
pnpm dev         # client(Vite) + server(Fastify) 병렬 기동
```

### 3. AI 분석은 Claude Code 안에서

본격 개발·AI 분석은 Claude Code 대화 안에서 진행한다. `CLAUDE.md` 자동 로드.

```bash
claude
```

## 컨벤션

`/Users/bag-yoseb/Desktop/Project/github/p2z` 의 CLAUDE.md와 코드 스타일을 판박이로 따른다.

## 상세 설계

`docs/specs/` 아래 Phase별 디자인 문서.
