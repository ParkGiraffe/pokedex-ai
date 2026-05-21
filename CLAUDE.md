# pokedex-agent — Claude 컨텍스트 가이드

박기린(op5321)의 개인 도구. 스마트누오(smartnuo.com) 클론 웹앱 + Claude Code 대화형 AI 분석.
대상 게임: 포켓몬스터 스칼렛/바이올렛(9세대 SV) 싱글배틀.

새 Claude 세션이 시작되면 **이 파일 → 아래 4개 → docs/specs/ 최신본** 순서로 읽고 컨텍스트를 복원한다.

## 컨텍스트 복원 순서 (반드시 이 순서)

1. `.claude/rules.md` — 표현·작업·커밋·AI 응답 하드룰 (이모지 금지·영어 직역 금지 등)
2. `.claude/code-principles.md` — p2z 컨벤션 코드 작성 원칙 6가지 + 패키지 추가 규칙
3. `.claude/client-stack.md` — `apps/client` 기술 스택과 디렉토리 구조
4. `.claude/data-policy.md` — PokeAPI 기반 데이터 갱신 정책 (손편집 금지)
5. `docs/lexicon.md` — 한국 SV 커뮤니티 어휘 사전 (응답·UI 문구에 사용)
6. `docs/specs/` 아래 가장 최신 디자인 문서

## 운영 원칙

- **모든 모델 호출은 Opus를 사용한다.** Sonnet/Haiku로 자동 격하 금지.
- **AI 에이전트 = Claude Code 대화형 (이 대화 자체).** 별도 LLM 백엔드를 만들지 않는다.
- **웹앱 ↔ Claude 연결은 클립보드 양방향 paste.** 자동 IPC 금지 (Phase 5 별도 검토).
- **새 패키지 도입 전 사용자 승인.** 임의로 의존성 추가하지 않는다.
- **데이터는 항상 PokeAPI 최신본에서 가져온다.** 한 글자도 손으로 입력하지 않는다.

## 프로젝트 구조 (목표)

```
pokedex-agent/
├── .claude/                  컨텍스트·하드룰·데이터 임시 위치
├── apps/
│   └── client/               React + Vite 웹앱 (스마트누오 클론 UI)
├── packages/
│   ├── pokedex-core/         결정론적 도메인 라이브러리 (데이터·공식·타입)
│   └── data-fetchers/        PokeAPI 수집 스크립트
├── docs/
│   ├── specs/                Phase별 디자인 문서
│   └── lexicon.md            한국 SV 커뮤니티 어휘 사전
├── CLAUDE.md                 이 파일
├── README.md
├── package.json              pnpm workspace 루트
├── pnpm-workspace.yaml
├── turbo.json
└── mise.toml
```

## Phase 분해 (전체 윤곽)

| Phase | 산출물                                | 상태       |
|-------|-------------------------------------|----------|
| 0     | 데이터 파운데이션 + 공식 라이브러리         | 설계 완료, 구현 대기 |
| 1     | 스마트누오 클론 UI (4페이지)              | 미착수      |
| 2     | 파티 분석 AI (정적)                      | 미착수      |
| 3     | 매치업 추천 AI                          | 미착수      |
| 4     | 실시간 배틀 의사결정 AI                   | 미착수      |

오늘 시점의 디자인 상세는 `docs/specs/2026-05-21-foundation-design.md` 참고.

## 외부 참조 컨벤션

코드 작성·디렉토리 구조·테스트 명명·패키지 선정은 `/Users/bag-yoseb/Desktop/Project/github/p2z` 의 CLAUDE.md와 `apps/client/CLAUDE.md`를 판박이로 따른다. 의문이 생기면 p2z 코드를 먼저 본다.
