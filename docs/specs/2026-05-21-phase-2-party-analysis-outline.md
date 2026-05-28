# Phase 2 — 파티 분석 AI (윤곽 spec)

> **상태:** 확정 (2026-05-21, Phase 1 완료 후 재검토).
> **Phase 0~1 반영:** 파티 빌더·`serializeForClaude("party-analysis")`·`parseClaudeResponse`·종족값 데이터 모두 동작. AppliedResult로 사이드패널 강화는 Phase 1에서 이미 적용됨.
> **메타 데이터 결정:** §8 "공식 API 없음"·§10 "부담되면 비우고 시작"에 따라 **빈 상태로 시작**한다. 데이터를 날조하지 않고(데이터 정책), 최신 시즌 메타 파일을 자동 로드하는 로더만 구축한다. 사용자가 시즌마다 `data/meta/`에 수기로 채운다. 실제 파티 5개 품질 평가도 사용자 몫(잔여 항목).
> **샘플 표기 교정:** spec 예시의 "구애조끼"는 실제로 존재하지 않음 → 코드/샘플에서는 "돌격조끼"(assault-vest)를 쓴다.

## 1. 목표

내 파티(6마리)를 입력으로 받아 **장점·약점·견제 필요 픽·보완 제안**을 한국 SV 커뮤니티 어휘로 분석한다. AI 추론은 Claude Code 대화형(나)이 담당하고, 그 추론 품질을 뒷받침하기 위해 **메타 데이터셋**을 새로 도입한다.

이 Phase가 첫 AI 검증이라, 응답 형식·메타 데이터 구조·프롬프트 가이드의 **표준을 여기서 굳혀** Phase 3·4로 이어간다.

## 2. 가정 (Phase 0~1 결과 기반)

- 파티 빌더 UI가 정상 동작하고 6슬롯 데이터가 `Party` Zod 스키마로 직렬화됨.
- `serializeForClaude("party-analysis", { party })` 가 안정적인 마크다운+JSON을 만듦.
- `parseClaudeResponse(text)` 가 `ClaudeResponseSchema`로 응답을 검증할 수 있음.
- Phase 0의 종족·기술·특성·도구 데이터로 정적 상성·종족값 분석이 가능.

## 3. 범위 · 비범위

**범위:**
- 메타 데이터 도입 (Pokemon Home 한국 사용률 + Smogon 9세대 세트 샘플 단발 수집)
- 파티 분석용 프롬프트 가이드 작성 (응답 톤·구조·어휘 가이드)
- 정적 분석 보조 함수(상성 매트릭스 계산·EV 균형 점검·역할 분류 추정)를 `pokedex-core/analysis/` 신설 패키지 모듈로 추가
- 파티 빌더 사이드패널의 "분석 결과 반영" UI 강화 (배지·하이라이트·교체 제안 카드)

**비범위:**
- 매치업 추천 (Phase 3)
- 배틀 의사결정 (Phase 4)
- 메타 데이터의 자동 시즌별 재수집 파이프라인 (수기 갱신만)
- 통계 기반 ML/예측 모델 (사용자가 Claude를 AI로 쓴다고 명시)

## 4. 메타 데이터 구조 (Phase 2의 핵심 신규)

```
packages/pokedex-core/data/
└── meta/
    ├── usage-2026-S1.json        Pokemon Home 시즌별 사용률 (Top 100)
    ├── sets-smogon-2026-S1.json  Smogon 9세대 인기 세트 (각 픽 5종 내외)
    └── role-tags.json            수기 역할 태그 (스위퍼·내구·교체축 등)
```

### `usage-2026-S1.json` 스키마

```jsonc
{
  "season": "2026-S1",
  "captured_at": "2026-MM-DDTHH:MM:SSZ",
  "source": "Pokemon Home 공식 시즌1 사용률 (단발 수집)",
  "entries": [
    { "rank": 1, "species": "어써러셔", "usage_rate": 32.5, "trend": "stable" },
    { "rank": 2, "species": "마릴리", "usage_rate": 28.1, "trend": "up" }
    // ... Top 100
  ]
}
```

### `sets-smogon-2026-S1.json` 스키마

```jsonc
{
  "season": "2026-S1",
  "source": "Smogon 9세대 SV 싱글 (단발 캡처)",
  "sets": {
    "어써러셔": [
      {
        "name": "내구형 어시스트",
        "level": 50,
        "nature": "신중",
        "ability": "재생력",
        "item": "구애조끼",
        "teraType": "강철",
        "moves": ["지진", "스톤에지", "기합구슬", "탁쳐서떨구기"],
        "evs": { "H": 252, "A": 4, "B": 0, "C": 0, "D": 252, "S": 0 },
        "share_rate": 0.45
      }
      // ... 3~5종
    ]
  }
}
```

### `role-tags.json` 스키마

```jsonc
{
  "어써러셔": ["내구형", "교체축", "재생회복"],
  "팬텀": ["에이스", "쌓기 스위퍼"],
  "전백수": ["선두", "설치기"]
}
```

## 5. 메타 데이터 수집 절차

자동화 안 함 (시즌 의존이라 사람 손이 더 정확). 다음 절차를 `docs/meta-collection.md` 로 문서화:

1. 시즌 종료 후 Pokemon Home 공식 발표 사용률 캡처 → `usage-<season>.json` 수기 작성
2. Smogon 9세대 SV 싱글 페이지에서 Top 30 픽의 가장 많이 쓰이는 세트 1~3개 캡처 → `sets-smogon-<season>.json` 수기 작성
3. `role-tags.json` 은 본인이 직접 운영하면서 추가
4. 시즌이 바뀌면 새 파일을 만들고, `pokedex-core` 가 가장 최신 시즌 파일을 자동 로드 (글롭 패턴)

## 6. 정적 분석 보조 함수 (`pokedex-core/analysis/`)

AI가 직접 계산하지 않아도 되도록, 결정론적으로 산출 가능한 것은 미리 계산해서 함께 paste:

```
packages/pokedex-core/src/analysis/
├── weaknessMatrix.ts     파티 × 18타입 = 약점/내성 매트릭스
├── speedTier.ts          파티의 스피드 라인 (느림/중간/빠름)
├── statBalance.ts        파티 종합 스탯 (물리 화력/특수 화력/내구)
├── synergy.ts            슬롯 간 시너지 점수 (예: 내구형 + 화력형 조합 = 안정)
└── role.ts               파티 역할 분포 (선두/에이스/교체축/회복)
```

각 함수는 순함수. 출력은 Zod 스키마로 정의.

`export.ts`의 `partyAnalysisBody`가 이 분석 결과를 함께 첨부해서 paste하므로, Claude(나)는 매번 같은 종족값 계산을 반복하지 않고 분석에 집중.

## 7. 프롬프트 가이드 (`docs/prompts/party-analysis.md`)

응답 톤·구조·어휘를 표준화하는 가이드. `serializeForClaude` 가 "## 요청" 섹션 끝에 가이드 일부를 인용한다.

가이드 핵심:
- 어휘: `docs/lexicon.md` 따르기
- 응답 구조: 자연어 분석 본문 → 표준 JSON 코드블록
- 약점은 "어느 타입에 몇 슬롯이 약한가" 형태로
- 추천은 슬롯 번호·근거(상성·메타·EV)·구체 픽까지
- 단정 금지 — "메타 픽 X에 대해 막을 슬롯이 없음" 같은 사실만, "확실히 패배"는 X

## 8. 위험 · 미해결 항목

| 항목 | 다룰 시점 |
|---|---|
| Pokemon Home 한국 사용률 페이지 캡처 방법 (공식 API 없음) | Phase 2 시작 시 사용자와 합의 (수기 입력 vs 스크린샷+OCR) |
| Smogon 데이터의 한국어 매핑 누락 (한국에서 안 쓰는 영문 별칭) | 수집 스크립트에 알리아스 테이블 추가 |
| Claude 응답 품질이 메타 깊이에 비례하는지 검증 (몇 케이스에 paste해보고 평가) | Phase 2 마지막 단계 |
| `role-tags.json` 수기 유지 부담 | Phase 3 진입 시 자동화 가능성 재검토 |

## 9. 완료 조건

- `packages/pokedex-core/data/meta/` 디렉토리에 1개 이상 시즌 데이터 존재
- `pokedex-core/analysis/` 5종 함수가 단위 테스트 통과 (각 함수당 5+ 도메인 언어 테스트)
- 파티 빌더에서 "Claude에 파티 분석 요청" 클릭 시 paste 데이터에 메타 정보 + 분석 결과 동시 포함
- 실제 파티 5개를 Claude에 paste해서 응답 받고, 모두 표준 JSON 검증 통과 + 본인 체감 분석 품질 만족
- `docs/prompts/party-analysis.md` 작성

## 10. 유연성 노트

- **Phase 1 사이드패널 UX가 미적용 상태라면** → Phase 2에서 사이드패널 강화 task를 추가
- **메타 데이터를 수기 수집하기 부담스러우면** → 아예 비우고 시작. AI가 종족값·상성만으로 분석. 효과 검증 후 확장.
- **`analysis/` 함수 일부가 Phase 1에서 페이지 UI에 필요해지면** (예: 도감 페이지에 약점 매트릭스 표시) → Phase 1로 당겨도 됨. 분리는 깨끗하니까 비용 거의 0.
- **`role-tags.json` 분류 체계가 마음에 안 들면** → 본인이 쓰는 표현으로 자유롭게 재설계. 표준 정의 없음.
- **Claude의 응답 어휘가 사용자 어휘와 어긋나면** → `docs/lexicon.md` 와 프롬프트 가이드를 즉시 업데이트. parse.ts는 손대지 않아도 됨 (스키마 자체는 어휘 불문).

## 11. 다음 Phase로 넘기는 결정 사항

- 메타 데이터의 최소 필수 깊이 (사용률만? 세트까지? 역할 태그까지?)
- Claude 응답의 actionable 필드가 실제로 UI 반영에 충분한지 (Phase 3에서 매치업 추천도 같은 스키마를 쓸 수 있는지)
- 정적 분석 보조 함수의 출력 형식이 Phase 3 매치업 분석에도 재사용 가능한지
