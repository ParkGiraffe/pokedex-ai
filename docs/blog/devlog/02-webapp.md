# 2편 — 웹앱을 만들며 부딪힌 설계 판단들

웹앱은 React + Vite, 라우팅·서버 상태는 TanStack Router·Query로 잡았다. 이 편은 화면 소개가
아니라, 그 화면들을 만들면서 실제로 멈춰서 고민해야 했던 세 가지 설계 판단과, 그 과정에서
사용자 데이터를 한 번 깨뜨렸던 시행착오다. 각 절에 실제 코드와 콘솔 출력을 같이 둔다.

## 1. "작업 중인 파티"를 어떻게 저장할 것인가

파티빌더에서 막힌 첫 지점은 검증이었다. 도메인 계층의 `Party` 스키마는 완성된 파티를 전제한다.
기술 4개가 필수고, 종족·특성이 비어 있으면 안 된다.

```ts
// packages/pokedex-core/src/types.ts
export const PartyMemberObject = z.object({
  species: z.string().min(1),
  ability: z.string().min(1),
  moves: z.array(z.string().min(1)).length(4),   // 기술 4개 필수
  evs: StatBlock,
  // ...
});
export const Party = z.array(PartyMember).min(1).max(6);
```

그런데 빌더의 현실은 다르다. 사용자는 종족만 정해놓고 기술은 나중에 채운다. 그 "작업 중"
상태도 저장·복원돼야 한다. 완성 스키마로 검증하면 미완성 파티는 저장 자체가 거부된다.

`z.array(...).length(4)`에 빈 칸 섞인 파티를 넣으면 이렇게 깨진다.

```
ZodError: [
  { "code": "too_small", "minimum": 1, "path": ["moves", 1], "message": "..." },
  { "code": "invalid_type", "path": ["ability"], "message": "Required" }
]
```

그래서 검증된 `Party`와 별개로, 부분 입력을 허용하는 `PartyDraft`를 따로 뒀다. 같은 모양이지만
제약을 푼다. 빈 문자열을 허용하고, 기술은 빈 칸이 섞일 수 있는 4-튜플로 받는다.

```ts
// packages/pokedex-core/src/types.ts
export const PartyDraftMember = z.object({
  species: z.string(),                                           // 빈 문자열 허용
  ability: z.string(),
  moves: z.tuple([z.string(), z.string(), z.string(), z.string()]), // 빈 칸 허용
  evs: StatBlock,
  // ...
});
export const PartyDraft = z.array(PartyDraftMember).min(1).max(6);
```

판단의 핵심은 "검증 스키마 하나로 모든 단계를 처리하려 하지 말자"였다. 저장은 draft로 느슨하게,
AI 분석에 넘길 때만 `Party`로 엄격하게 검증한다. 적은 만큼 저장되고 적은 만큼 복원된다. 이
draft 타입은 나중에 서버 프리셋 저장(jsonb 컬럼)에서도 그대로 재사용됐다 — 한 번 잘 나눠둔
경계가 두고두고 값을 했다.

## 2. 피벗이 사용자의 저장 데이터를 깨뜨렸다

이게 진짜 시행착오였다. 작업 중 파티는 zustand persist로 localStorage에 저장한다. 그런데 SV에서
챔피언스로 피벗하면서 노력치 체계가 0~252에서 0~32로 바뀌었다. 문제는 이미 옛 포맷(예: 252)으로
저장해둔 데이터다. 새 빌더를 열자 노력치 입력이 32 상한을 한참 넘은 값으로 채워져 화면이
엉망이 됐다. 내 브라우저에 옛 데이터가 남아 있어서 처음엔 "왜 입력이 이상하지" 하고 한참
헤맸다.

해결은 persist의 버전 마이그레이션이었다. 스토어에 버전을 매기고, 옛 버전 데이터를 읽을 때
0~252를 0~32로 변환한다.

```ts
// apps/client/src/pages/party/model/store.ts
{
  name: 'pokedex-party',
  version: 2,
  migrate: (persistedState, version) => {
    if (version >= 2 || typeof persistedState !== 'object' || persistedState === null) {
      return persistedState;
    }
    const state = persistedState as { members?: Array<Record<string, unknown>> };
    if (!Array.isArray(state.members)) return persistedState;
    state.members = state.members.map((member) => {
      const evs = member.evs as Record<string, number> | undefined;
      if (!evs) return member;
      const converted = Object.fromEntries(
        Object.entries(evs).map(([k, v]) => [k, Math.min(32, Math.max(0, Math.round(Number(v) / 8)))]),
      );
      return { ...member, evs: converted };
    });
    return state;
  },
}
```

`round(v / 8)`로 252를 32 근처로 눌러 담고 `Math.min(32, ...)`로 상한을 씌운다. 실제로 변환이
어떻게 되는지 찍어보면 이렇다.

```
[migrate v1->v2] 옛 본가 EV: {"H":252,"A":0,"B":4,"C":0,"D":0,"S":252}
[migrate v1->v2] 변환 결과: {"H":32,"A":0,"B":1,"C":0,"D":0,"S":32}
```

252는 32로, 4는 1로 눌린다. 교훈은 분명했다. 데이터 포맷을 바꾸는 피벗은 코드만 바꾸는 게
아니라 이미 사용자 기기에 저장된 데이터까지 책임져야 한다. 마이그레이션 경로 없는 포맷 변경은
조용히 사용자 데이터를 깨뜨린다.

## 3. 데미지 타수 표기를 한국 커뮤니티 관습에 맞추기

계산기에서 마지막까지 손본 건 결과 표기였다. 흔한 데미지 계산기는 "2~3타"처럼 범위로 보여준다.
그런데 한국 SV 커뮤니티는 타수를 "확정 N타"와 "난수 N타" 두 단일 형식으로만 쓴다. 범위 표기는
통용되지 않아 어색하다.

그래서 최악 롤(min) 기준 타수와 최선 롤(max) 기준 타수를 각각 계산해서, 둘이 같으면 "확정",
다르면 "난수"로 단일하게 표기한다.

```ts
// apps/client/src/pages/calculator/lib/calc.ts
const guaranteedHits = damage.min > 0 ? Math.ceil(defenderHp / damage.min) : Infinity;
const possibleHits   = damage.max > 0 ? Math.ceil(defenderHp / damage.max) : Infinity;
const hitsText = !Number.isFinite(guaranteedHits)
  ? ''
  : guaranteedHits === possibleHits
    ? `확정 ${guaranteedHits}타`
    : `난수 ${possibleHits}타`;
```

1편에서 만든 결정론 공식을 그대로 불러 실제로 계산해보면 이렇게 나온다. 한카리아스(고집,
공격 노력치 32)의 지진을 무보정 한카리아스가 맞는 상황이다.

```
[calc] 한카리아스 지진 → 한카리아스 | 공격실수치 200 / 방어 115 / HP 183
[calc] 데미지 99~117 (54.1%~63.9%) 상성 1배
[calc] 16롤: 99 100 100 102 103 105 105 106 108 109 111 111 112 114 115 117
[calc] 표기 → 확정 2타
```

최악 롤(99)로도 두 방이면 HP 183을 넘기고(99×2=198), 최선 롤(117)로도 한 방엔 못 잡으니
guaranteed와 possible이 둘 다 2 — "확정 2타"다. 16롤을 막대 그래프로 같이 보여줘서, 운에 따라
데미지가 어떻게 흔들리는지 눈으로 확인하게 했다.

> [스크린샷: 계산기(/) — 위 입력 상태의 데미지 결과 "확정 2타" 표기와 16롤 막대 그래프.
> 현재 dev에서 localhost 띄워 캡처 예정]

## 4. UI 프리미티브는 직접 만들었다

마지막으로 작은 판단 하나. 버튼·카드·셀렉트 같은 프리미티브는 외부 컴포넌트 라이브러리 대신
직접 만들었다. Tailwind에 cva(class-variance-authority)로 변형을 정의하고 `cn`으로 합성한다.

```ts
// apps/client/src/common/ui/Button.tsx
const button = cva('inline-flex items-center justify-center gap-2 rounded-md font-medium transition', {
  variants: {
    variant: { primary: 'bg-primary text-primary-foreground hover:bg-primary/90', /* ... */ },
    size: { sm: 'h-8 px-3 text-xs', md: 'h-9 px-4 text-sm', /* ... */ },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});
```

라이브러리 종속 없이 챔피언스 테마(18타입 정식 색·HP 바·스탯 박스)를 내 마음대로 입히고,
프로젝트 전체 톤을 한 곳에서 통제하기 위해서였다.

## 정리

웹앱 편의 진짜 내용은 "페이지 목록"이 아니라 세 판단이었다. 검증을 단계별로 나눈 것(draft),
피벗이 깨뜨린 저장 데이터를 마이그레이션으로 복구한 것, 표기를 커뮤니티 관습에 맞춘 것. 화면은
결정론 도메인 위의 얇은 껍데기일 뿐이고, 고민은 늘 그 경계에서 일어났다.
