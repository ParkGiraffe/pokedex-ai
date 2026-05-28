# pokedex-agent — Claude 컨텍스트 가이드

박기린(op5321)의 개인 도구. 포켓몬 챔피언스 싱글배틀 분석 웹앱 + Claude API 기반 AI 분석.
대상 게임: 포켓몬스터 스칼렛/바이올렛(9세대 SV) 싱글배틀.

새 Claude 세션이 시작되면 **이 파일 → 아래 4개 → docs/specs/ 최신본** 순서로 읽고 컨텍스트를 복원한다.

## 컨텍스트 복원 순서 (반드시 이 순서)

1. `.claude/rules.md` — 표현·작업·커밋·AI 응답 하드룰 (이모지 금지·영어 직역 금지 등)
2. `.claude/code-principles.md` — p2z 컨벤션 코드 작성 원칙 6가지 + 패키지 추가 규칙
3. `.claude/client-stack.md` — `apps/client` 기술 스택과 디렉토리 구조
4. `.claude/data-policy.md` — PokeAPI 기반 데이터 갱신 정책 (손편집 금지)
5. `.claude/rules/` — 언어·프레임워크별 코드 가이드 (p2z에서 가져옴)
   - `type-script.md` · `react.md` · `i18n.md` · `git.md` — 본 프로젝트에서 그대로 적용
   - `expo.md` · `react-native.md` · `nestjs.md` — 참고용 (현재 본 프로젝트엔 mobile·server 없음)
6. `.claude/skills/` — p2z 표준 작업 절차 (스킬 카드)
   - `tanstack-router/SKILL.md` · `tanstack-query-api-client/SKILL.md` — `apps/client` 라우팅·API
   - `tailwind-cva-component/SKILL.md` — UI 컴포넌트 작성 표준
   - `testing-vitest/SKILL.md` — 테스트 작성 표준
   - `check-all/SKILL.md` · `pr-title/SKILL.md` — 일반 작업 절차
   - 나머지(`dto-response`, `infra-up`, `nest-*`)는 server/infra 도입 전까지 참고용
7. `docs/lexicon.md` — 한국 SV 커뮤니티 어휘 사전 (응답·UI 문구에 사용)
8. `docs/p2z-refs/` — p2z의 루트·apps별 CLAUDE.md·README 사본 (원문 대조용)
9. `docs/specs/` 아래 가장 최신 디자인 문서

## 운영 원칙

- **모델 선택은 작업 특성에 맞춤.** 이미지 OCR(`/import-party`)은 Opus 4.7 (정확도). 추천 시스템(`/analyze-party`, `/matchup-leadrec`, `/battle-advice`)은 Sonnet 4.6 (한국 SV 어휘 정확도 — Haiku는 종족·도구·기술 이름을 fabricate하는 사례가 잦았음). 임의 격하 금지지만 작업별 권장 모델은 위와 같다.
- **AI 추천은 서버가 Anthropic API로 직접 호출한다.** `serializeForClaude`로 프롬프트 본문을 만들고 `ClaudeResponseSchema`로 구조화 응답을 받는다. 클립보드 paste 왕복 UX는 폐기됨.
- **새 패키지 도입 전 사용자 승인.** 임의로 의존성 추가하지 않는다.
- **데이터는 항상 PokeAPI 최신본에서 가져온다.** 한 글자도 손으로 입력하지 않는다.

## 프로젝트 구조 (목표)

```
pokedex-agent/
├── .claude/                  컨텍스트·하드룰·데이터 임시 위치
├── apps/
│   └── client/               React + Vite 웹앱
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

| Phase | 산출물                                | spec | plan |
|-------|-------------------------------------|------|------|
| 0     | 데이터 파운데이션 + 공식 라이브러리         | `docs/specs/2026-05-21-foundation-design.md` | `docs/plans/2026-05-21-phase-0-foundation.md` |
| 1     | 웹앱 UI (4페이지)              | `docs/specs/2026-05-21-phase-1-client-ui-outline.md` (윤곽) | Phase 0 완료 후 작성 |
| 2     | 파티 분석 AI (정적)                      | `docs/specs/2026-05-21-phase-2-party-analysis-outline.md` (윤곽) | Phase 1 완료 후 작성 |
| 3     | 매치업 추천 AI                          | `docs/specs/2026-05-21-phase-3-matchup-leadrec-outline.md` (윤곽) | Phase 2 완료 후 작성 |
| 4     | 실시간 배틀 의사결정 AI                   | `docs/specs/2026-05-21-phase-4-battle-decision-outline.md` (윤곽) | Phase 3 완료 후 작성 |

각 Phase 진입 절차는 `docs/specs/2026-05-21-foundation-design.md` 의 "9a. Phase 진행 메타룰" 참고. 윤곽 spec은 갱신 가능 — 앞 Phase에서 발견한 사실로 자유롭게 재설계한다.

## 외부 참조 컨벤션

코드 작성·디렉토리 구조·테스트 명명·패키지 선정은 `/Users/bag-yoseb/Desktop/Project/github/p2z` 의 CLAUDE.md와 `apps/client/CLAUDE.md`를 판박이로 따른다. 의문이 생기면 p2z 코드를 먼저 본다.
