# Phase 2 — 파티 분석 보강 구현 계획

> 기반 spec: `docs/specs/2026-05-21-phase-2-party-analysis-outline.md` (확정)
> 선행: Phase 1 완료(파티 빌더 + claude-bridge 동작).

## 목표

AI(Claude 대화형)가 같은 결정론적 계산을 반복하지 않도록, 파티의 정적 분석(약점·스피드·스탯·시너지·역할)을 `pokedex-core/analysis/`에 순함수로 만들고, 이를 `serializeForClaude("party-analysis")` 출력에 첨부한다. 메타 데이터는 빈 상태로 시작하되 로더를 둔다. 프롬프트 가이드를 굳힌다.

## 범위 (코딩 가능, 자율)

- **T1 analysis 모듈**: `src/analysis/` — `weaknessMatrix`(파티×18타입), `speedTier`, `statBalance`(물리/특수 화력·내구 합), `synergy`(약점 분산 점수), `role`(역할 분포 추정). 각 순함수 + 결과 타입. 도메인 언어 테스트.
- **T2 메타 로더**: `src/meta.ts` — `data/meta/usage-*.json` 글롭 중 최신 시즌 로드(없으면 `null`). Zod 스키마. `data/meta/.gitkeep`만 두고 실데이터는 사용자가 채움.
- **T3 export 강화**: `partyAnalysisBody`가 analysis 결과(+있으면 메타 요약)를 마크다운으로 첨부. 라운드트립·기존 테스트 유지.
- **T4 프롬프트 가이드**: `docs/prompts/party-analysis.md` 작성. `serializeForClaude` "## 요청"에 핵심 일부 인용.
- **T5 파티 페이지**: 분석 요약(약점 분산·역할 분포)을 화면에도 표시. 검증.

## 비범위 / 사용자 몫

- 실제 메타 데이터(Pokemon Home 사용률·Smogon 세트) 수집 — 공식 API 없음(spec §8). 사용자가 `data/meta/`에 수기 갱신.
- Claude 응답 품질의 사람 평가(파티 5개) — 사용자 몫.
- 매치업(Phase 3)·배틀(Phase 4).

## 완료 조건

- `analysis/` 5함수 단위 테스트 통과(도메인 언어)
- 메타 로더가 빈 디렉토리에서 안전(null) + 파일 있으면 최신 로드
- 파티 분석 export에 analysis 결과 포함(테스트)
- 루트 type-check·test 통과
- `docs/prompts/party-analysis.md` 존재
