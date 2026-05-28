# 메타 데이터 수집 절차

> 시즌 의존 데이터라 자동화하지 않는다(공식 API 없음). 사람이 시즌마다 직접 갱신한다.
> 데이터를 손으로 적되, 종족명은 PokeAPI 한국어 정식 표기를 그대로 쓴다(왜곡 금지).

## 절차

1. 시즌 종료 후 Pokemon Home 공식 사용률을 캡처해
   `packages/pokedex-core/data/meta/usage-<season>.json`을 작성한다. 스키마는 `src/meta.ts`의 `UsageMeta`.
2. 필요하면 Smogon 9세대 SV 싱글 인기 세트를 `sets-smogon-<season>.json`으로 캡처한다.
3. 역할 태그는 `role-tags.json`에 본인 운영 어휘로 추가한다.
4. 새 시즌 파일을 만든 뒤 `src/meta.ts`의 `currentMeta`에 import해 연결한다(최신 시즌 1개만 연결).

## 현재 상태

미수집(`currentMeta = null`). 메타가 없어도 분석은 종족값·상성 기반으로 동작하며, 메타를 연결하면 사용률·역할 정보가 분석 paste에 함께 포함된다.

## 주의

- 사용률 수치를 추정/날조하지 않는다. 공식 발표값만 입력한다.
- "구애조끼"처럼 존재하지 않는 도구명을 쓰지 않는다(실제: 돌격조끼 등).
