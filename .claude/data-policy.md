# 데이터 소스 · 갱신 정책

> 도감·기술·특성·도구·타입 데이터는 항상 **PokeAPI v2 (`https://pokeapi.co/api/v2`)** 에서 가져온 최신본을 진실로 삼는다. 손으로 적어넣지 않는다.

## 왜 PokeAPI인가

- 공식 The Pokémon Company 로컬라이제이션을 가공한 다국어 데이터셋. `language.name == "ko"` 가 한국 정식 발매판 표기와 동일.
- 9세대 SV 본편 + DLC(벽록의 가면·남청의 원반)까지 1025마리 전체 커버.
- 종족값·타입·특성·기술·도구가 동일한 스키마로 일관되게 제공.
- 비공식 사이트(나무위키 등)는 AI 접근이 막혀 있고, 한국어 사이트마다 표기가 미세하게 다르다 (예: "테라스탈" vs "테라스탈 타입"). PokeAPI 한국어가 가장 표준.

## 갱신 정책

- **데이터는 `packages/data-fetchers/` 스크립트로 PokeAPI에서 직접 가져온다.** 손편집 금지.
- `pokedex-core/data/*.json`은 빌드 산출물 취급. 갱신이 필요하면 fetcher를 다시 돌린다.
- 새 DLC·신 기술·신 도구가 출시되면 PokeAPI가 업데이트된 뒤 fetcher를 재실행해서 반영한다.
- fetcher는 멱등(idempotent)이어야 한다. 같은 인풋이면 같은 JSON 결과.

## 1차 fetcher 결과 (이미 검증됨)

`.claude/data/pokedex.json` 에 1025마리 기본 도감이 검증된 상태로 존재한다 (2026-05-21 기준 18.3초 만에 수집 완료, 한국어명 누락 0건).

이 파일은 임시 위치이며, monorepo 구조 세팅 후 `packages/pokedex-core/data/pokedex.json` 으로 이동한다.

## 향후 fetcher 확장 범위

| 데이터          | PokeAPI 엔드포인트            | 한국어 지원 |
|---------------|--------------------------|---------|
| 포켓몬 종족·도감  | `/pokemon-species/{id}/` | 있음 (ko) |
| 포켓몬 타입·능력치 | `/pokemon/{id}/`         | 영문 슬러그 (타입은 `/type/`에서 매핑) |
| 타입            | `/type/{id}/`            | 있음 (ko) |
| 기술 (막치기 등) | `/move/{id}/`            | 있음 (ko) |
| 특성 (악취 등)   | `/ability/{id}/`         | 있음 (ko) |
| 도구 (마스터볼 등) | `/item/{id}/`           | 있음 (ko) |
| 세대            | `/generation/{id}/`      | 있음 (ko) |

모두 `language.name == "ko"` 필드로 한국 정식 표기 추출 가능을 직접 검증함.

## 메타 데이터 (사용률·인기 빌드)

- Pokemon Home 공식 시즌별 사용률은 PokeAPI 외부에서 수집한다.
- 9세대 SV 인기 빌드 샘플은 Smogon 또는 한국 커뮤니티에서 시즌마다 단발로 수집해서 `pokedex-core/data/meta-{season}.json` 에 저장한다.
- 메타 데이터는 시즌 의존이므로 자동화하지 말고 사람 손으로 갱신 시점을 결정한다.

## 어떤 경우에도

- **데이터를 손으로 입력하지 않는다.** 한 마리만 추가하고 싶어도 fetcher를 다시 돌리는 게 원칙.
- **데이터 정의 코드와 fetcher 결과가 어긋나면 fetcher 결과가 정답이다.**
- 캐싱이 필요하면 `node_modules/.cache/pokeapi/` 같은 빌드 캐시에 두고, 소스 트리에는 fetcher 산출물(JSON)만 커밋한다.
