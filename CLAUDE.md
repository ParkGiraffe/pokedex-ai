# pokedex-agent — Claude 컨텍스트 가이드

박기린(op5321)의 개인 도구. 포켓몬 챔피언스 싱글배틀 분석 웹앱 + Claude API 기반 AI 분석.
대상 게임: 포켓몬 챔피언스(9세대 SV 메커니즘 기반, 메가진화·테라스탈 공존, 노력치 0~32 포인트 시스템) 싱글배틀.

새 Claude 세션이 시작되면 **이 파일 → 아래 컨텍스트 복원 순서** 대로 읽고 컨텍스트를 복원한다.

## 컨텍스트 복원 순서 (반드시 이 순서)

1. `.claude/rules.md` — 표현·작업·커밋·AI 응답 하드룰 (이모지 금지·영어 직역 금지 등)
2. `.claude/code-principles.md` — p2z 컨벤션 코드 작성 원칙 6가지 + 패키지 추가 규칙
3. `.claude/client-stack.md` — `apps/client` 기술 스택과 디렉토리 구조
4. `.claude/data-policy.md` — PokeAPI 기반 데이터 갱신 정책 (손편집 금지)
5. `.claude/rules/` — 언어·프레임워크별 코드 가이드 (p2z에서 가져옴)
   - `type-script.md` · `react.md` · `i18n.md` · `git.md` — 본 프로젝트에서 그대로 적용
   - `expo.md` · `react-native.md` — Phase F의 `apps/mobile`(Expo)에서 적용 예정
   - `nestjs.md` — `apps/server`는 NestJS다(Fastify→NestJS 전환 완료, Phase A). 정식 적용 대상. `apps/server/CLAUDE.md` 참고
6. `.claude/skills/` — p2z 표준 작업 절차 (스킬 카드)
   - `tanstack-router/SKILL.md` · `tanstack-query-api-client/SKILL.md` — `apps/client` 라우팅·API
   - `tailwind-cva-component/SKILL.md` — UI 컴포넌트 작성 표준
   - `testing-vitest/SKILL.md` — 테스트 작성 표준
   - `check-all/SKILL.md` · `pr-title/SKILL.md` — 일반 작업 절차
   - `dto-response`·`infra-up`·`nest-*` — NestJS 전환에 따라 정식 적용(Phase A 이후)
7. `docs/lexicon.md` — 한국 SV 커뮤니티 어휘 사전 (응답·UI 문구에 사용)
8. `docs/p2z-refs/` — p2z의 루트·apps별 CLAUDE.md·README 사본 (원문 대조용)

## 운영 원칙

- **모델 선택은 작업 특성에 맞춤.** 이미지 OCR(`/import-party`)은 Opus 4.7 (정확도). 추천 시스템(`/analyze-party`, `/matchup-leadrec`, `/battle-advice`)은 Sonnet 4.6 (한국 SV 어휘 정확도 — Haiku는 종족·도구·기술 이름을 fabricate하는 사례가 잦았음). 임의 격하 금지지만 작업별 권장 모델은 위와 같다.
- **AI 추천은 서버가 Anthropic API로 직접 호출한다.** `serializeForClaude`로 프롬프트 본문을 만들고 `ClaudeResponseSchema`로 구조화 응답을 받는다. 클립보드 paste 왕복 UX는 폐기됨.
- **새 패키지 도입 전 사용자 승인.** 임의로 의존성 추가하지 않는다.
- **데이터는 항상 PokeAPI 최신본에서 가져온다.** 한 글자도 손으로 입력하지 않는다.
- **굵직한 기능·버그 수정이 끝나면 `/devlog`로 개발일지를 남긴다.** 컨텍스트가 살아 있을 때(실제 에러 원문·기각한 대안·막힌 지점) `docs/blog/devlog/`에 적고, 화면이 바뀌었으면 스크린샷을 `docs/blog/devlog/img/`에 캡처한다. 절차·표현 규칙은 `.claude/skills/devlog/SKILL.md`.

## 활성 로드맵

계정(카카오·네이버 자체 OAuth)·프리셋 티어(무료 2/유료 20)·일일 쿼터(무료 2/유료 100)·웹 Stripe 결제·Expo 모바일(스크린샷 비전) 도입이 목표다. Supabase는 쓰지 않는다(네이버 미지원). 승인된 단계 계획: `~/.claude/plans/6-27-harmonic-lecun.md`. 진행: Phase 0~C 완료(2026-06-04: A NestJS전환·B 인증/DB·C 프리셋 티어 무료2/유료20) → **D(일일 쿼터, 다음)** → E(결제) → F(모바일). B에서 MikroORM+Postgres(docker)·내부 로그인(이메일+비번, OAuth 끼울 수 있게 추상화)·JWT 도입. 인증은 헥사고날 포트/어댑터라 카카오·네이버는 어댑터만 추가하면 된다. 로컬 인프라: `mise run infra up --env <development|test>`(Postgres 5435).

## 프로젝트 구조 (현재)

```
pokedex-agent/
├── .claude/                  컨텍스트·하드룰·데이터 임시 위치
├── apps/
│   ├── client/               React + Vite 웹앱 (battle·calculator·dex·matchup·party·speed 페이지)
│   └── server/               NestJS 11 + Express + MikroORM/Postgres. Anthropic 직접 호출(추천·OCR) + 계정·인증(내부 로그인+JWT)
├── packages/
│   ├── pokedex-core/         결정론적 도메인 라이브러리 (데이터·공식·타입·export·matchup·decision)
│   ├── battle-engine/        배틀 상태·데미지 계산 엔진
│   └── data-fetchers/        PokeAPI 수집 스크립트
├── docs/
│   ├── lexicon.md            한국 SV 커뮤니티 어휘 사전
│   └── p2z-refs/             p2z CLAUDE.md·README 사본 (원문 대조용)
├── CLAUDE.md                 이 파일
├── README.md
├── package.json              pnpm workspace 루트
├── pnpm-workspace.yaml
├── turbo.json
└── mise.toml
```

> 현재 설계의 진실은 코드(특히 `packages/pokedex-core/src/types.ts`)와 이 CLAUDE.md다. SV·클립보드 paste 시대(노력치 0~252 EV, paste 왕복 UX 등)에 작성된 2026-05-21자 spec·plan 문서는 폐기돼 제거됐다. 신규 기능 로드맵은 위 "활성 로드맵"과 `~/.claude/plans/6-27-harmonic-lecun.md`를 따른다.

## 외부 참조 컨벤션

코드 작성·디렉토리 구조·테스트 명명·패키지 선정은 `/Users/bag-yoseb/Desktop/Project/github/p2z` 의 CLAUDE.md와 `apps/client/CLAUDE.md`를 판박이로 따른다. 의문이 생기면 p2z 코드를 먼저 본다.
