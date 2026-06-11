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
Zod로 있으니 그걸 재사용하는 편이 자연스러웠다. 파이프 전문이 이게 전부다.

```ts
// apps/server/src/common/zod-validation.pipe.ts
// 도메인 스키마는 pokedex-core에 Zod로 정의돼 있어, class-validator로 재작성하지 않고
// 그대로 재사용한다. 검증 실패는 BadRequestException(400)으로 변환된다.
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.message);
    }
    return result.data;
  }
}
```

NestJS 표준대로라면 class-validator DTO를 썼겠지만, 같은 검증을 두 군데(도메인 Zod + DTO
데코레이터)에 이중 유지하는 비용이 프레임워크 순응보다 크다고 판단했다. 파이프 하나로
프레임워크 메커니즘(파이프 단계에서 400 변환)은 그대로 지키면서 스키마는 단일 출처로 남는다.

### 발목 잡은 함정: 워크스페이스 패키지 번들링

여기서 예상 못 한 벽을 만났다. `pokedex-core`와 `battle-engine`은 raw `.ts`를 export하고
있었다. 개발 중에는 문제없었지만, 컴파일된 NestJS 서버가 이 패키지들을 소비하려 하자 확장자·
모듈 형식이 어긋나 깨졌다.

해결은 두 패키지를 tsup으로 번들해 ESM dist로 내보내는 것이었다. 단일 자기완결 번들 + 번들된
`.d.ts`로 만들어, NodeNext 소비자(서버)와 Bundler 소비자(클라이언트) 양쪽에서 문제없이 쓰이게
했다. `pokedex-core`는 브라우저 안전한 메인 엔트리와, 데이터 파일의 파일시스템 경로를
노출하는 node 전용 서브패스(`./node`)로 분리했다. 이 분리가 나중에 6편의 번들 최적화에서
다시 쓰인다.

## Phase B: 계정과 인증

다음은 DB와 로그인이다. 카카오·네이버 간편로그인이 최종 목표였지만, 우선 내부 로그인(이메일+
비밀번호)부터 만들되 **나중에 OAuth를 끼울 수 있게 추상화**하는 방향을 택했다.

그래서 인증을 헥사고날(포트/어댑터)로 설계했다. 도메인에는 인증 전략·비밀번호 해시·토큰
발급이라는 세 가지 포트(인터페이스)만 두고, 구체 구현은 전부 어댑터로 분리했다. 핵심 포트인
인증 전략은 이렇게 생겼다.

```ts
// apps/server/src/auth/domain/auth-provider.port.ts
// 인증 제공자 전략. internal(이메일+비번)·kakao·naver가 같은 포트를 구현한다.
export interface AuthProvider {
  readonly name: ProviderName;
  authenticate(credentials: unknown): Promise<VerifiedIdentity>;
}
```

지금은 이메일+비밀번호 어댑터 하나가 이 포트를 구현하고 있고, 해시는 node:crypto의
scrypt(외부 의존성 0), 토큰은 JWT 어댑터가 맡는다. 인증 서비스 본체는 포트에만 의존하므로
구체 라이브러리를 모른다. 카카오·네이버는 나중에 이 포트를 구현한 어댑터를 하나씩 추가해
레지스트리 배열에 넣으면 끝이다.

DB는 MikroORM 7 + Postgres다. 로컬은 docker compose로 띄우는데, 로컬의 5432~5434가 이미
점유돼 있어 포트는 5435로 잡았다. `User` 엔티티는 uuidv7을 PK로 쓰고, provider·tier를 enum으로
두었다.

## Phase C·D: 프리셋 티어와 일일 쿼터

프리셋(저장한 파티)에는 티어별 개수 제한을 뒀다(무료 2, 유료 20). 단순히 "개수 세고
넘으면 거부"로 짜면, 동시에 두 요청이 들어왔을 때 둘 다 "1개네, 통과"를 보고 캡을 뚫는다.
그래서 개수 검사와 생성을 한 트랜잭션으로 묶었다.

```ts
// apps/server/src/presets/presets.service.ts
return this.em.transactional(async (em) => {
  const user = await em.findOne(User, { id: userId });
  if (!user) {
    throw new NotFoundException('사용자를 찾을 수 없습니다');
  }
  const cap = PRESET_CAP_BY_TIER[user.tier as UserTier];
  if ((await em.count(Preset, { user: userId })) >= cap) {
    throw new ForbiddenException(`... 프리셋을 최대 ${cap}개까지 저장할 수 있습니다`);
  }
  const preset = em.create(Preset, { user, name, party });
  em.persist(preset);
  return preset;
});
```

일일 쿼터는 더 까다로웠다. AI 호출은 비용이 드니, 호출 직전에 원자적으로 소비량을 올리고
한도를 넘으면 막아야 한다. 트랜잭션조차 쓰지 않고, 레이스가 원천 불가능한 단일 upsert
한 방으로 처리했다. 실제 서비스 코드다.

```ts
// apps/server/src/quota/quota.service.ts
// KST 기준 오늘(YYYY-MM-DD). en-CA 로캘이 ISO 형식을 준다.
private today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

// 단일 upsert로 원자적 소비. cap 미만이면 +1 후 새 count, 한도면 null(레이스에도 초과 0건).
private async consume(userId: string, cap: number): Promise<number | null> {
  const rows = await this.em.getConnection().execute<Array<{ count: number }>>(
    `insert into usage_daily (user_id, usage_date, count) values (?, ?, 1)
     on conflict (user_id, usage_date) do update set count = usage_daily.count + 1
     where usage_daily.count < ?
     returning count`,
    [userId, this.today(), cap],
  );
  return rows[0]?.count ?? null;
}

// AI 호출 직전 게이트. 한도 초과면 429.
async consumeOrThrow(userId: string): Promise<void> {
  const cap = await this.capOf(userId);
  if ((await this.consume(userId, cap)) === null) {
    throw new HttpException(`오늘 질의 한도(${cap}회)를 모두 사용했습니다`, HttpStatus.TOO_MANY_REQUESTS);
  }
}
```

한도 미만일 때만 증가하고 새 값을 돌려준다. 한도면 아무 행도 안 돌아오므로, 동시에 여러 요청이
들어와도 초과 소비가 0건이다. 리셋은 KST 자정 기준 — 날짜 문자열 자체를 서울 타임존으로
서버에서 만들기 때문에 클라이언트 시계도, 서버 머신의 타임존도 믿을 필요가 없다.

### MikroORM 7 함정 모음

전환 중 MikroORM 7에서 몇 가지 사소하지만 시간 잡아먹는 차이를 만났다. 스키마 동기화는
`schema.update()`(과거 `updateSchema`가 아님), 영속화는 `em.persist()` 후 `flush()`,
JwtModule의 `expiresIn` 타입이 좁아 캐스팅이 필요했다. 테스트에서는 글로벌 EntityManager를
요청 컨텍스트 밖에서 쓸 수 없어, 쿼터를 채울 때 raw connection을 써야 했다.

## 정리

백엔드 전환의 핵심은 "한 번에 다 바꾸지 않기"였다. 프레임워크 교체(A) → DB·인증(B) →
프리셋(C) → 쿼터(D)로 쪼개고, 각 단계를 테스트로 고정했다. 가장 값진 설계 판단은 인증을
포트/어댑터로 추상화한 것이다. 덕분에 카카오·네이버 로그인은 "어댑터 추가"라는 작은 일로
남았다. 다음 편은 이 계정 체계가 화면에 어떻게 드러났는지 — 프론트 연동 이야기다.
