# 6편 — 리팩토링과 품질

기능이 쌓이면 어딘가 삐걱대기 시작한다. 데이터가 중복 관리되는 것 같고, 쓸데없는 파일이
보이고, 자원이 일원화되지 않은 느낌. 이 편은 그 감을 증거로 확인하고 손본 기록이다.
세 건 모두 "발견 → 문제 코드 → 수정 → 수정 증거" 순으로 적는다.

## 1. 서버 전용 데이터가 브라우저로 새고 있었다

### 발견

번들이 이상하게 컸다. 뜯어보니 gen9 Smogon 폴백 데이터가 클라이언트 메인 번들에 통째로
들어가 있었다. 이 데이터(약 2MB)는 챔피언스 공개 샘플이 없는 포켓몬의 예상 셋을 채우는
용도로, **오직 서버측 battle-engine만 쓴다.** 브라우저는 단 한 바이트도 안 쓰는데 매번
받고 있던 것이다.

### 문제 구조

원인은 배럴 export였다. 폴백 조회 함수들이 showdown 유틸 모듈에 같이 들어 있었고, 그
모듈이 JSON을 직접 import했다. 메인 배럴(index)이 showdown 모듈을 재export하니, 번들러
입장에선 "클라이언트가 이 JSON을 쓸 수도 있다"가 되어 2MB를 인라인했다. 코드 한 줄이
아니라 **모듈 경계 설계**가 버그였다.

### 수정

폴백을 전용 모듈로 찢고, 메인 배럴에서 빼고, node 전용 서브패스로만 노출했다. 실제로
추가된 모듈이 이것이다.

```ts
// packages/pokedex-core/src/gen9-fallback.ts (신설)
import setsRaw from "../data/gen9-fallback/sets-gen9.json" with { type: "json" };
import usageRaw from "../data/gen9-fallback/usage-gen9.json" with { type: "json" };

// gen9 Smogon 폴백 데이터(약 2MB)는 브라우저가 쓰지 않고 서버측 battle-engine만 소비한다.
// 메인 배럴(index)에 넣지 않고 node 전용 ./fallback 서브패스로만 노출해 클라이언트 번들에서 제외한다.
// 챔피언스 샘플이 없는 종(로스터의 약 38%)에 대해서만 최후의 가정 셋·사용률로 쓰인다.

export const smogonSets = (species: string): SmogonSet[] => setsById[showdownIdOf(species)]?.sets ?? [];
export const smogonUsage = (species: string): SmogonUsage | undefined => usageById[showdownIdOf(species)];
```

패키지 exports에는 서브패스 하나가 늘었다. 소비자(battle-engine)는 이 경로로만 가져온다.

```diff
 // packages/pokedex-core/package.json
   "exports": {
     ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
+    "./fallback": {
+      "types": "./dist/gen9-fallback.d.ts",
+      "default": "./dist/gen9-fallback.js"
+    },
     "./data/*": "./data/*.json"
   },
```

### 판단 하나와 결과

폴백 자체를 지울지도 고민했다. 측정해보니 챔피언스 공개 샘플은 합법 로스터 274종 중
169종(62%)만 덮었다. 나머지 38%는 이 폴백이 load-bearing이었다. 그래서 지우지 않고
옮겼다. 결과: **클라이언트 메인 번들 3.1MB → 2.4MB.** 이 글을 쓰며 다시 빌드해본 현재
산출물로도 유지되고 있다.

```
$ pnpm --filter client build
dist/assets/index-CBGZRIOG.js   2,535.56 kB │ gzip: 425.75 kB
```

## 2. lint가 사실 아무것도 안 하고 있었다

### 발견

코드 컨벤션을 따른다고 믿고 있었는데, 확인해보니 lint 설정 파일이 리포에 하나도 없었다.
`pnpm lint`는 turbo의 lint 태스크를 부르는데, 어느 패키지에도 lint 스크립트가 없으니
"실행할 게 없음 = 성공"으로 늘 초록이었다. 게이트가 텅 비어 있던 것이다.

### 수정

eslint + prettier를 도입하되, 패키지마다 설정을 복붙하는 대신 루트에 공유 base를 두고
각 패키지가 얇게 확장하게 했다. 핵심은 룰 강도의 전략이다 — 한 번에 전부 error로 켜면
기존 코드 수백 곳이 깨져서 게이트를 영영 못 켠다. 실제 base 설정의 주석이 그 전략이다.

```js
// eslint.config.base.mjs
// - import 정렬·unused-imports·prettier/prettier 는 안전하게 auto-fix 되므로 error 유지.
// - type-safety 계열(no-unsafe-*, explicit-module-boundary-types, no-floating-promises)은
//   기존 코드가 이 룰 없이 작성되어 위반이 많고 수동 수정이 위험하므로 우선 warn 으로 둔다.
rules: {
  '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
  '@typescript-eslint/explicit-module-boundary-types': 'warn',
  '@typescript-eslint/no-unsafe-argument': 'warn',
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  // ...unsafe 계열 전부 warn
},
```

자동 수정이 안전한 것(import 정렬, 미사용 import, 포맷)만 error, 수동 수정이 필요한
타입 안전 계열은 warn. 이렇게 먼저 게이트를 초록으로 만들고, warn은 점차 조여간다.

### 수정 증거

전 코드를 single quote·printWidth 120으로 정규화한 뒤 현재 상태다.

```
$ pnpm lint
client:lint: 195 problems (0 errors, 195 warnings)
 Tasks:    5 successful, 5 total
```

error 0으로 게이트는 막혔고, 남은 warning은 갚아야 할 빚 목록으로 보이게 됐다.
(이 자동 수정에는 함정이 하나 있었는데, 그건 8편에서 다룬다.)

## 3. 메가스톤 이름이 틀어져 있었다

### 발견

챔피언스 도구 사전과 루트 도구 사전은 같은 도구를 다르게 부르면 안 된다. 둘을 슬러그
기준으로 대조해봤더니 메가스톤 다섯 개가 어긋나 있었다. 아래는 수정 직전 커밋의 실제
데이터로 다시 돌린 대조 결과 전문이다.

```
alakazite: champions=후딘나이트  root=후디나이트
charizardite-x: champions=리자몽나이트 X  root=리자몽나이트X
charizardite-y: champions=리자몽나이트 Y  root=리자몽나이트Y
mewtwonite-x: champions=뮤츠나이트 X  root=뮤츠나이트X
mewtwonite-y: champions=뮤츠나이트 Y  root=뮤츠나이트Y
```

### 문제 코드

원인은 챔피언스 도구 생성기였다. 메가스톤 한국어명을 루트 사전에서 가져오지 않고
"종족명 + 나이트"로 **독립 파생**하면서, 받침 처리(후딘 → 후디나이트)를 모르고 X·Y 앞에
공백까지 넣고 있었다. 문제의 한 줄:

```ts
// 수정 전 — X·Y 앞에 공백을 넣어 파생한다
return ko ? { ko: `${ko}나이트${megaForme ? ` ${megaForme}` : ''}`, megaForme } : undefined;
```

어느 표기가 맞는지는 추측하지 않고 공식 표기를 찾아 확인했다. 알라카잠 메가스톤의
정식명은 중복 받침을 떨군 "후디나이트", X·Y는 공백 없이 붙인 "리자몽나이트X"가 맞았다.
즉 루트 사전(PokeAPI 공식)이 옳았고, 파생 로직이 틀렸다.

### 수정

여기서 1편의 원칙(데이터는 손으로 입력하지 않는다)과 부딪혔다. 그래서 데이터를 고치지
않고 **생성기를 먼저 고쳤다.** 메가도 루트 사전의 공식명을 항상 우선하고, 루트에 없는
챔피언스 오리지널 메가에만 파생값을 쓰되 공백 없이 붙인다. 실제 수정 diff다.

```diff
 // packages/data-fetchers/src/fetch-champions-items.ts
-  return ko ? { ko: `${ko}나이트${megaForme ? ` ${megaForme}` : ''}`, megaForme } : undefined;
+  return ko ? { ko: `${ko}나이트${megaForme ?? ''}`, megaForme } : undefined;

   for (const slug of slugs) {
+    // ko는 루트 items.json(PokeAPI 공식)을 항상 우선한다. 후딘나이트가 아닌 후디나이트,
+    // 공백 없는 리자몽나이트X 등 공식 표기를 단일 출처에서 가져오기 위함이다.
+    const rootKo = itemKoById.get(toId(slug));
     const mega = megaOf(slug);
     if (mega) {
-      items.push({ slug, ko: mega.ko, isMega: true, megaForme: mega.megaForme });
+      items.push({ slug, ko: rootKo ?? mega.ko, isMega: true, megaForme: mega.megaForme });
       continue;
     }
```

그리고 생성기가 낼 값과 똑같이 데이터를 교정했다.

### 다시 어긋나지 않게: 가드 테스트

마지막으로 이 drift가 다시는 조용히 생기지 못하게 정합성 테스트를 박았다. 두 사전을
통째로 대조해서 어긋난 항목 목록이 비어 있어야 통과한다.

```ts
// packages/pokedex-core/test/champions-items.spec.ts
it('루트 items.json에 있는 도구의 한글명은 루트와 일치한다', () => {
  const rootKoByEn = new Map(allItems().map((item) => [toShowdownId(item.en), item.ko]));
  const mismatches = championsItems
    .map((item) => ({ slug: item.slug, champions: item.ko, root: rootKoByEn.get(toShowdownId(item.slug)) }))
    .filter((entry) => entry.root !== undefined && entry.root !== entry.champions);

  expect(mismatches).toEqual([]);
});
```

수정 전 데이터에 이 테스트를 돌리면 위의 다섯 항목이 `mismatches`로 그대로 출력되며
실패하고, 수정 후에는 빈 배열로 통과한다. 발견에 쓴 대조가 그대로 회귀 가드가 된 셈이다.

## 그 외 정리

미사용 의존성을 들어냈고, SV·클립보드 시대에 작성돼 더는 맞지 않는 설계 문서들을 제거하면서
그 문서를 참조하던 곳도 함께 정리했다.

## 정리

리팩토링의 교훈은 "감을 증거로 바꾼 뒤 손대라"였다. 번들이 크다는 감은 측정(3.1MB→2.4MB)
으로, lint가 부실하다는 감은 설정 부재 확인으로, 데이터가 틀어졌다는 감은 대조 출력 다섯
줄로 확인했다. 그리고 데이터를 고칠 때는 항상 생성기부터 고치고, 같은 비교를 가드 테스트로
남겼다. 다음 편은 이 위에 올린 커뮤니티·AI 확장 기능들이다.
