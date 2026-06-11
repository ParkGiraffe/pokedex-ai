# 4편 — 백엔드 전환: Fastify에서 NestJS로

초기 서버는 Fastify로 만든 가벼운 게이트웨이였다. 여덟 개 라우트 중 넷이 Anthropic을
호출하고, 나머지 넷은 결정론 연산을 돌렸다. 그런데 계정·프리셋·과금을 얹으려니 구조가
필요했다. 모듈·의존성 주입·DB 계층이 갖춰진 NestJS + MikroORM + Postgres로 전환하기로 했다.

전환은 단계로 쪼갰다. 한 번에 다 바꾸면 회귀를 잡을 수 없기 때문이다.

## Phase A: 프레임워크만 교체

먼저 DB 없이 프레임워크만 Fastify에서 NestJS 11(Express 기반)로 옮겼다. 여덟 개 엔드포인트를
같은 경로·같은 동작으로 이식하고, 동등성 테스트로 입출력을 고정했다. "기능은 그대로, 뼈대만
교체"로 범위를 좁혀 회귀 위험을 최소화한 것이다. DB 도입은 다음 단계로 미뤘다.

검증은 class-validator 대신 Zod 파이프를 만들어 썼다. 도메인 스키마가 이미 `pokedex-core`에
Zod로 있으니 그걸 재사용하는 편이 자연스러웠다.

### 발목 잡은 함정: 워크스페이스 패키지 번들링

여기서 예상 못 한 벽을 만났다. `pokedex-core`와 `battle-engine`은 raw `.ts`를 export하고
있었다. 개발 중에는 문제없었지만, 컴파일된 NestJS 서버가 이 패키지들을 소비하려 하자 확장자·
모듈 형식이 어긋나 깨졌다.

해결은 두 패키지를 tsup으로 번들해 ESM dist로 내보내는 것이었다. 단일 자기완결 번들 + 번들된
`.d.ts`로 만들어, NodeNext 소비자(서버)와 Bundler 소비자(클라이언트) 양쪽에서 문제없이 쓰이게
했다. `pokedex-core`는 브라우저 안전한 메인 엔트리와, node 전용 서브패스(`./node`, 파일시스템
경로 `DATA_DIR` 노출)로 분리했다. 이 분리가 나중에 5편의 번들 최적화에서 다시 쓰인다.

## Phase B: 계정과 인증

다음은 DB와 로그인이다. 카카오·네이버 간편로그인이 최종 목표였지만, 우선 내부 로그인(이메일+
비밀번호)부터 만들되 **나중에 OAuth를 끼울 수 있게 추상화**하는 방향을 택했다.

그래서 인증을 헥사고날(포트/어댑터)로 설계했다. 도메인에는 `AuthProvider`(전략)·
`PasswordHasher`·`TokenService` 포트만 두고, 구체 구현은 어댑터로 분리했다 —
`InternalAuthProvider`(이메일+비번), `ScryptPasswordHasher`(node:crypto, 무의존),
`JwtTokenService`. `AuthService`는 포트에만 의존하므로 라이브러리를 모른다. 카카오·네이버는
나중에 `AuthProvider` 어댑터만 추가해 provider 레지스트리에 넣으면 된다.

DB는 MikroORM 7 + Postgres다. 로컬은 docker compose로 띄우는데, 로컬의 5432~5434가 이미
점유돼 있어 포트는 5435로 잡았다. `User` 엔티티는 uuidv7을 PK로 쓰고, provider·tier를 enum으로
두었다.

## Phase C·D: 프리셋 티어와 일일 쿼터

프리셋(저장한 파티)에는 티어별 개수 제한을 뒀다(무료 2, 유료 20). 개수 검사와 생성을 한
트랜잭션으로 묶어, 동시 요청이 제한을 넘기지 못하게 했다.

일일 쿼터는 더 까다로웠다. AI 호출은 비용이 드니, 호출 직전에 원자적으로 소비량을 올리고
한도를 넘으면 막아야 한다. 레이스 컨디션 없이 이걸 하려고 단일 upsert로 처리했다.

```sql
insert into usage_daily (user_id, usage_date, count) values (?, ?, 1)
on conflict (user_id, usage_date) do update set count = usage_daily.count + 1
where usage_daily.count < ?
returning count
```

한도 미만일 때만 증가하고 새 값을 돌려준다. 한도면 아무 행도 안 돌아오므로, 동시에 여러 요청이
들어와도 초과 소비가 0건이다. 리셋은 KST 자정 기준으로, 날짜를 `Asia/Seoul`로 서버에서 계산해
클라이언트 시계를 믿지 않게 했다.

### MikroORM 7 함정 모음

전환 중 MikroORM 7에서 몇 가지 사소하지만 시간 잡아먹는 차이를 만났다. 스키마 동기화는
`schema.update()`(과거 `updateSchema`가 아님), 영속화는 `em.persist()` 후 `flush()`,
JwtModule의 `expiresIn` 타입이 좁아 캐스팅이 필요했다. 테스트에서는 글로벌 EntityManager를
요청 컨텍스트 밖에서 쓸 수 없어, 쿼터를 채울 때 raw connection을 써야 했다.

## 정리

백엔드 전환의 핵심은 "한 번에 다 바꾸지 않기"였다. 프레임워크 교체(A) → DB·인증(B) →
프리셋(C) → 쿼터(D)로 쪼개고, 각 단계를 테스트로 고정했다. 가장 값진 설계 판단은 인증을
포트/어댑터로 추상화한 것이다. 덕분에 카카오·네이버 로그인은 "어댑터 추가"라는 작은 일로
남았다. 다음 편은 이렇게 커진 코드베이스를 정리한 리팩토링 이야기다.
