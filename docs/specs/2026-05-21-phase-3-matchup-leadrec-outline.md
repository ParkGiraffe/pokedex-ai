# Phase 3 — 매치업 선두 추천 AI (윤곽 spec)

> **상태:** 윤곽 (outline). Phase 2 구현이 끝난 뒤 이 spec을 다시 검토·확정한 다음 `writing-plans` 사이클로 진입한다.
> **유연성 원칙:** 현재 가정 기준 윤곽이다. Phase 0~2 구현 중 발견되는 사실(메타 데이터 실제 깊이, 분석 어휘 정착, AI 응답 품질)에 따라 자유롭게 수정한다.

## 1. 목표

내 파티 + 상대 파티(전부 공개되었거나, 일부만 공개된 상황) 입력으로 **선두로 낼 후보의 우선순위**와 각 선택의 **근거·예상 상대 응수**를 한국 SV 커뮤니티 어휘로 답한다.

이 Phase는 Phase 2의 정적 분석을 한 단계 발전시켜, **두 파티의 결정론적 매치업 점수**를 미리 계산해 paste하고, Claude(나)가 그 점수와 메타 지식을 합쳐 추천을 만든다.

## 2. 가정 (Phase 0~2 결과 기반)

- Phase 2의 메타 데이터(사용률·세트·역할 태그)가 안정적으로 존재.
- `pokedex-core/analysis/` 의 약점·스피드·스탯 분석이 검증됨.
- 파티 분석 응답이 본인 체감으로 쓸 만한 수준.
- 사용자가 매치업 모드를 UI에서 어떻게 진입하는지 결정됨 (Phase 2 마무리 시 합의).

## 3. 범위 · 비범위

**범위:**
- 결정론적 매치업 점수 계산기 (`pokedex-core/matchup/` 신설)
- 파티 빌더에 "상대 파티 입력" UI 추가 (또는 별도 페이지)
- `serializeForClaude("matchup-leadrec", { state })` 의 paste 데이터에 매치업 점수 매트릭스 첨부
- 프롬프트 가이드 `docs/prompts/matchup-leadrec.md` 작성
- "상대가 N마리만 공개" 같은 부분 정보 상황 처리

**비범위:**
- 턴 단위 의사결정 (Phase 4)
- 상대 행동 시뮬레이션 (Phase 4의 게임 트리 탐색)
- 정확한 상대 도구·EV 추정 (확률만 다룸)

## 4. 매치업 점수 계산기 (`pokedex-core/matchup/`)

각 슬롯(내 픽 × 상대 픽) 조합에 대해 결정론적 점수 산출:

```
packages/pokedex-core/src/matchup/
├── pairwise.ts          개별 매치업 점수 (1대1)
├── leadScore.ts         "이 픽을 선두로 냈을 때" 의 종합 점수
├── speedAdvantage.ts    스피드 우위 백분율 (랭크·도구·필드 반영)
└── coverage.ts          내 파티가 상대를 처리 가능한 슬롯 수
```

### `pairwise.ts` 출력 (개념적)

```typescript
type PairwiseScore = {
  attacker: string;
  defender: string;
  myKO2: boolean;          // 2턴 안에 KO 가능?
  opKO2: boolean;          // 상대가 2턴 안에 KO 가능?
  speedAdvantage: "win" | "lose" | "tie" | "depends";
  expectedDamageRange: [number, number]; // % of defender HP
  notes: string[];          // "급소 의존", "테라 후만 가능", "도구 필요"
};
```

### `leadScore.ts` 출력

```typescript
type LeadScore = {
  myPick: string;
  versusKnownOpponent: PairwiseScore[];
  versusFullOpponent?: PairwiseScore[]; // 비공개 슬롯 포함
  worstCase: PairwiseScore;
  bestCase: PairwiseScore;
  metaPickRiskAdjustment: number; // 상대가 메타 픽일 확률 가중
  finalScore: number;             // 0~100, 종합
};
```

이 점수는 **참고 자료**이지 결정이 아니다. Claude(나)가 점수 + 메타 + 본인 빌드 의도를 합쳐 최종 추천을 만든다.

## 5. UI 윤곽

옵션 A — 파티 빌더 안의 모드 전환:
- 파티 빌더 좌측에 "내 파티", 우측에 "상대 파티(공개분만)" 슬롯
- 슬롯에 "비공개" 마크 가능
- 상단에 "선두 추천 요청" 버튼

옵션 B — 별도 페이지 `/matchup`:
- 두 파티를 나란히 입력
- 매치업 매트릭스 시각화 (Heatmap)
- "선두 추천 요청" 버튼

Phase 2 마무리 시점에 본인 사용감 보고 결정. 윤곽 단계에선 옵션 A 우선.

## 6. 부분 정보 처리

상대 파티가 일부만 공개됐을 때:
- 공개된 픽은 `PartyMember`로 정확히 입력
- 비공개 슬롯은 "?" 로 두고, 메타 데이터의 Top 10에서 가능성 가중치 부여
- Claude paste 시 "공개된 N마리 + 메타 기반 추정 M마리" 형태로 정보 구조화
- 응답에서 "가정이 깨지면 추천이 바뀌는 지점"을 명시하도록 프롬프트 가이드

## 7. 프롬프트 가이드 (`docs/prompts/matchup-leadrec.md`)

응답 구조:
1. 선두 후보 Top 3 우선순위 (한국 어휘로 근거)
2. 각 후보의 예상 상대 응수 (상위 2~3개)
3. "이 후보를 피해야 할 경우" 명시
4. 표준 JSON 코드블록 (스키마는 `parse.ts`의 `ClaudeResponseSchema` 그대로 — task 만 "matchup-leadrec")

## 8. 위험 · 미해결 항목

| 항목 | 다룰 시점 |
|---|---|
| 매치업 점수의 "정확도 환상" 위험 (사용자가 점수만 보고 결정할 수 있음) | UI 표시 시 "참고용 점수" 명시 + Claude 응답에서도 점수가 다인 것처럼 답하지 말라고 프롬프트 |
| 비공개 슬롯 가중치 모델의 단순성 (Top10 균등 가중은 너무 거칠 수 있음) | Phase 3 마지막에 실제 사용감 보고 정교화 |
| 상대 도구·테라스탈 타입을 모르는 상태에서의 추정 | Smogon 세트 데이터에서 가장 흔한 도구·테라를 가정. 응답에 가정 명시. |
| 점수 계산 비용 (6×6 = 36 페어를 모두 계산) | 캐싱·메모이제이션. 첫 호출 시 1초 이내 목표 |

## 9. 완료 조건

- `pokedex-core/matchup/` 4종 함수가 단위 테스트 통과 (각 5+ 도메인 언어 테스트)
- 매치업 매트릭스 UI에서 시각화 가능
- 실제 매치업 10개를 Claude에 paste하고 모두 표준 JSON 응답 + 본인 체감 추천 품질 만족
- 부분 정보(상대 3마리 공개) 시나리오 5개 테스트 통과
- `docs/prompts/matchup-leadrec.md` 작성

## 10. 유연성 노트

- **`pairwise.ts` 의 점수 모델이 거칠다면** → 가중치만 바꿔서 재실행. 함수 시그니처는 유지.
- **부분 정보 처리가 너무 복잡하면** → 일단 풀 정보(상대 6마리 다 공개) 시나리오만 지원. 부분 정보는 Phase 4로 미룸.
- **매치업 점수가 Claude 응답 품질을 안 올린다는 게 검증되면** → 점수 계산 제거하고 메타+분석만 paste. 코드는 보관 (Phase 4에서 재활용 가능)
- **Phase 2의 메타 데이터가 부족해서 추천 근거가 약하면** → Phase 3 시작 시점에 메타 추가 수집 task 삽입.

## 11. 다음 Phase로 넘기는 결정 사항

- 매치업 점수 캐싱 전략 (Phase 4의 게임 트리 탐색에서 재활용)
- "공개 정보로 답할 수 없는 상황" 의 응답 톤 (Phase 4의 실시간 의사결정에서 더 자주 발생)
- 시즌 변경 시 메타 갱신 비용 (자동화 도입 필요성)
