---
name: devlog
description: Write or update a Korean dev-blog journal entry in docs/blog/devlog/ right after finishing a feature or bugfix, while session context (errors, dead ends, decisions) is still alive. Use when the user says "/devlog", "데브로그 써줘", "개발일지 남겨줘", or right after completing a notable feature/bugfix/refactor in this repo. Also captures screenshots of affected pages into docs/blog/devlog/img/.
---

# devlog

기능·버그 수정·리팩토링이 끝난 직후, **컨텍스트가 살아 있을 때** 블로그 원고용 개발일지를
`docs/blog/devlog/`에 남긴다. 나중에 회고로 재구성하는 글과는 디테일 밀도가 다르다 — 실제
에러 메시지, 기각한 대안, 막혔던 지점을 그 자리에서 적는 것이 이 스킬의 존재 이유다.

## 실행 절차

1. **대상 정리.** 이번 세션(또는 지정된 작업)에서 무엇을 했는지 한 줄로 요약한다.
   굵직한 기능만 적지 않는다 — **테마·토글·한도·응답 계약 같은 작은 디테일도 사용자
   지시로 기록 대상이다.** 세션에서 손댄 작은 변경을 빠뜨리지 않았는지 한 번 훑는다.
   기존 편 목록(`docs/blog/devlog/00-index.md`)을 읽고, 기존 편에 절을 보태는 게 맞는지
   새 편을 만드는 게 맞는지 판단한다. 새 편이면 다음 번호를 쓰고 index에 추가한다.

2. **서사 재료 수집.** 아래 순서로 모은다. 기억이 아니라 기록에서 가져온다.
   - 이번 대화에서 실제로 겪은 일: 실패한 시도, 실제 에러 메시지(원문 그대로), 기각한
     설계와 그 이유, 의외였던 발견
   - `git log --oneline` 해당 구간 커밋들
   - 테스트·빌드 결과 등 검증 증거

3. **스크린샷 캡처.** 화면이 바뀐 작업이면 dev 서버를 띄우고(`mise run infra up --env
   development` → 서버 3007 → 클라이언트) Chrome 도구로 해당 페이지를 캡처해
   `docs/blog/devlog/img/`에 **내용을 설명하는 kebab-case 파일명**으로 저장한다.
   - 버그 수정이면 가능한 한 **수정 전 화면도** 남긴다. 작업 트리가 깨끗하면 수정 직전
     커밋을 잠깐 체크아웃해 재현 캡처하고 반드시 원래 브랜치로 복귀한다.
   - 본문에는 상대 경로로 싣는다: `![설명](./img/파일명.jpg)`

4. **본문 작성.** 기존 편들의 문체를 따른다(평어체 "~했다", 중립 톤). 구성은 자유지만
   기본 뼈대는 "왜 → 막힌 지점 → 시도와 실패(에러 원문) → 해결 → 교훈"이다.

5. **검증.** 본문 속 이미지 경로가 전부 실재하는지 확인하고, 아래 표현 규칙 위반이 없는지
   훑은 뒤 결과를 보고한다. 커밋은 사용자 지시가 있을 때만 한다.

## 표현 규칙 (하드룰)

- **이모지 금지.** `.claude/rules.md`의 전 산출물 공통 규칙이다.
- **내부 식별자 남발 금지.** 독자는 이 코드베이스를 못 본다. 우리가 만든 함수·클래스·변수
  이름은 **같은 글 안에 해당 코드 블록을 보여줄 때만** 본문에서 언급한다. 코드를 안 보여줄
  거면 역할을 한국어로 풀어 쓴다("종족 검색 함수", "직렬화 함수"). 누구나 아는 공개
  API(useEffect, zod, persist 등)·패키지명·라우트 경로는 예외다.
- **고유명사 왜곡 금지.** 포켓몬·기술·도구는 공식 한국어 표기, 커뮤니티 어휘는
  `docs/lexicon.md`를 따른다.
- **수치를 지어내지 않는다.** 번들 크기·테스트 수·승률 같은 숫자는 측정했거나 기록에 있는
  값만 쓴다.
