# 메타 데이터 수집 절차

> 종족명·기술명 등은 항상 PokeAPI 한국어 정식 표기를 그대로 쓴다(왜곡·날조 금지).

## 현재 메타 소스 3계층

| 소스 | 위치 | 수집 방식 |
|------|------|---------|
| 챔피언스 사용률·세트 | `packages/pokedex-core/data/champions/` (roster·samples-singles·usage-singles) | `data-fetchers`의 fetch-champions 스크립트 (`PKMNCHAMPS_ANON_KEY` 필요) |
| 9세대 SV 폴백 | `packages/pokedex-core/data/gen9-fallback/` (sets-gen9·usage-gen9) | Smogon 자동 수집. 챔피언스 샘플이 없는 종족(로스터의 약 38%)에 load-bearing |
| 리빙 메타 | 서버 `GET /meta/usage` | 전 사용자 배틀 전적(BattleLog) 익명 집계. 출시 후 데이터가 쌓이면 1차 소스 |

폴백 분리 사유와 번들 영향은 `packages/pokedex-core/src/gen9-fallback.ts`(node 전용 `./fallback` 서브패스) 참고.

## 시즌 공식 사용률 수기 수집 (선택, 미수집 상태)

`src/meta.ts`의 `currentMeta`는 Pokemon Home 공식 시즌 사용률을 수기로 연결하는 자리다. 공식 API가 없어 자동화하지 않으며, 현재 `null`(미수집). 메타가 없어도 분석은 종족값·상성 기반으로 동작한다.

1. 시즌 종료 후 Pokemon Home 공식 사용률을 캡처해 `UsageMeta` 스키마(`src/meta.ts`)에 맞는 JSON으로 작성한다(위치는 `data/` 아래 새 시즌 파일).
2. 역할 태그는 `RoleTags` 스키마로 본인 운영 어휘를 추가한다.
3. `src/meta.ts`의 `currentMeta`에 import해 연결한다(최신 시즌 1개만 연결).

## 주의

- 사용률 수치를 추정/날조하지 않는다. 공식 발표값만 입력한다.
- "구애조끼"처럼 존재하지 않는 도구명을 쓰지 않는다(실제: 돌격조끼 등).
