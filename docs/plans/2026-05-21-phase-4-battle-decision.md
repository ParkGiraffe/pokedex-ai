# Phase 4 — 실시간 배틀 의사결정 구현 계획 (깊이 0)

> 기반 spec: `docs/specs/2026-05-21-phase-4-battle-decision-outline.md` (확정, 깊이 0)
> 선행: Phase 0~3 완료.

## 목표

배틀 중 내 액티브의 4기술별 데미지·KO 확률을 결정론으로 계산해 보여주고, `serializeForClaude("battle-decision")` paste에 첨부한다. Claude(대화형)가 상황을 받아 다음 턴 추천을 만든다. 깊이 0(상대 응수 트리 없음, 메타 미수집).

## 점수 모델 (결정론)

- 내 액티브(파티 멤버)의 각 기술: `findMove`로 타입·위력·분류 조회 → `calculateDamage` 16롤.
- 상대 active: 종족 + HP%(사용자 입력). 상대 방어/HP는 **0투자 중립 가정**(보수적, 명시).
- KO 확률 = 16롤 중 (롤 ≥ 상대 현재 HP) 비율.
- 변화기/위력 없는 기술은 데미지 0으로 표시.

## Task

- **T1 decision 모듈** `pokedex-core/src/decision.ts`: `moveOptions(myActive, opponentSpecies, opponentHpPercent)` → 기술별 {type, power, min, max, koChance, rolls}. 도메인 언어 테스트.
- **T2 export 첨부**: `battleDecisionBody`가 내 액티브 옵션 표를 첨부(myField 있을 때). 기존 테스트 유지.
- **T3 `/battle` 페이지**: 배틀 트래커(내 액티브 선택·상대 종족·HP%·날씨·턴) → 옵션 표(기술별 데미지·KO%) → ExportButton(battle-decision)+paste. 라우트·네비.
- **T4 프롬프트 가이드 + 검증**: `docs/prompts/battle-decision.md`. 루트 type-check·test·build 통과.

## 완료 조건

- decision 모듈 단위 테스트 통과(결정론: 동일 입력 → 동일 출력)
- `/battle` 진입 + 옵션 표 표시 + export/paste 동작(테스트)
- battle-decision export에 옵션 표 포함(테스트)
- 루트 type-check·test 통과, 빌드 성공
- `docs/prompts/battle-decision.md` 존재

## 사용자 몫 / 후속

- 실제 배틀 10턴 품질 평가. 메타 수집 후 상대 EV 정교화·게임 트리(상대 응수)·기댓값 도입.
