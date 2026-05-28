# Phase 3 — 매치업 선두 추천 구현 계획

> 기반 spec: `docs/specs/2026-05-21-phase-3-matchup-leadrec-outline.md` (확정)
> 선행: Phase 2 완료(analysis·메타 로더·export 첨부).

## 목표

내 파티 + 상대 공개분으로 결정론적 매치업 verdict를 계산해 화면에 매트릭스로 보여주고, `serializeForClaude("matchup-leadrec")` paste에 첨부한다. Claude(대화형)가 점수+메타로 선두 추천을 만든다.

## 점수 모델 (기술셋 비의존, 결정론)

- **스피드**: 내 픽은 파티 실투자로 actualStat(S), 상대는 최대 투자(252·+성격·31) 가정 → win/lose/tie.
- **공격 압박(offensivePressure)**: 내 픽 자속 타입들의 상대 대상 최대 상성 배율(0~4).
- **수비 위험(defensiveRisk)**: 상대 자속 타입들의 내 픽 대상 최대 상성 배율(0~4).
- **verdict**: `offensivePressure − defensiveRisk + 0.5*speed` → 유리/불리/호각.

## Task

- **T1 matchup 모듈** `pokedex-core/src/matchup.ts`: `pairwise(myMember, opponentSpecies)`, `speedAdvantage`, `leadScore(myMember, opponents[])`, `coverage(party, opponents[])`. 결과 타입 + 도메인 언어 테스트. index에 `matchup` 네임스페이스 export.
- **T2 export 첨부**: `matchupLeadBody`가 매치업 매트릭스(내 픽별 verdict)와 leadScore를 마크다운으로 첨부. 기존 테스트 유지.
- **T3 `/matchup` 페이지**: 내 파티(party store) + 상대 종족 입력(최대 6) → 매치업 매트릭스 heatmap + leadScore 정렬 + ExportButton(matchup-leadrec)+paste. 라우트 추가, 네비 추가.
- **T4 프롬프트 가이드 + 검증**: `docs/prompts/matchup-leadrec.md`. 루트 type-check·test·build 통과.

## 완료 조건

- matchup 4함수 단위 테스트 통과
- `/matchup` 진입 + 매트릭스 표시 + export/paste 동작(테스트)
- matchup-leadrec export에 매트릭스 포함(테스트)
- 루트 type-check·test 통과, 빌드 성공
- `docs/prompts/matchup-leadrec.md` 존재

## 사용자 몫

- 실제 매치업 10개 품질 평가, 비공개 슬롯 메타 가중(메타 수집 후).
