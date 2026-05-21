# Phase 0 — 데이터 파운데이션 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 결정론적 도메인 라이브러리 `@pokedex-agent/pokedex-core`를 만들어 1025마리 한국어 도감·기술·특성·도구·타입 데이터와 SV 데미지·스피드·실수치·상성 공식을 제공하고, Claude paste 직렬화·파싱을 갖추는 것. 이후 모든 Phase가 이 라이브러리에 의존.

**Architecture:** pnpm + turbo monorepo. `packages/pokedex-core`는 순수 TypeScript 라이브러리(UI·네트워크 의존 0). `packages/data-fetchers`는 PokeAPI에서 데이터를 받아 `pokedex-core/data/*.json`을 멱등하게 생성. 모든 공식은 순함수, 모든 모델은 Zod 스키마.

**Tech Stack:** TypeScript 6, Vitest 4, Zod 4, pnpm 10, turbo 2, Node 24, mise.

**참조 문서:**
- 디자인 스펙: `docs/specs/2026-05-21-foundation-design.md`
- 코드 원칙: `.claude/code-principles.md`
- 표현 규칙: `.claude/rules.md`, `docs/lexicon.md`
- 기술 가이드: `.claude/rules/type-script.md`, `.claude/rules/react.md`
- 데이터 정책: `.claude/data-policy.md`

---

## 파일 구조

```
pokedex-agent/
├── package.json                                    Task 1
├── pnpm-workspace.yaml                             Task 1
├── turbo.json                                      Task 1
├── mise.toml                                       Task 1
├── tsconfig.base.json                              Task 1
├── .npmrc                                          Task 1
├── .editorconfig                                   Task 1
├── packages/
│   ├── pokedex-core/
│   │   ├── package.json                            Task 2
│   │   ├── tsconfig.json                           Task 2
│   │   ├── vitest.config.ts                        Task 2
│   │   ├── src/
│   │   │   ├── index.ts                            Task 2 entry
│   │   │   ├── types.ts                            Task 3
│   │   │   ├── data.ts                             Task 4
│   │   │   ├── lookup.ts                           Task 12
│   │   │   ├── formula/
│   │   │   │   ├── index.ts                        Task 13
│   │   │   │   ├── stat.ts                         Task 13
│   │   │   │   ├── matchup.ts                      Task 14
│   │   │   │   ├── damage.ts                       Task 15
│   │   │   │   └── speed.ts                        Task 16
│   │   │   ├── export.ts                           Task 17
│   │   │   └── parse.ts                            Task 18
│   │   ├── data/
│   │   │   ├── pokedex.json                        Task 4 이동
│   │   │   ├── types.json                          Task 6
│   │   │   ├── moves.json                          Task 8
│   │   │   ├── abilities.json                      Task 9
│   │   │   └── items.json                          Task 10
│   │   └── test/
│   │       ├── types.spec.ts                       Task 3
│   │       ├── lookup.spec.ts                      Task 12
│   │       ├── stat.spec.ts                        Task 13
│   │       ├── matchup.spec.ts                     Task 14
│   │       ├── damage.spec.ts                      Task 15
│   │       ├── speed.spec.ts                       Task 16
│   │       ├── export.spec.ts                      Task 17
│   │       ├── parse.spec.ts                       Task 18
│   │       └── fixtures/
│   │           └── damage-cases.json               Task 19
│   │
│   └── data-fetchers/
│       ├── package.json                            Task 5
│       ├── tsconfig.json                           Task 5
│       └── src/
│           ├── pokeapi.ts                          Task 5
│           ├── fetch-types.ts                      Task 6
│           ├── fetch-pokedex.ts                    Task 7
│           ├── fetch-moves.ts                      Task 8
│           ├── fetch-abilities.ts                  Task 9
│           ├── fetch-items.ts                      Task 10
│           └── fetch-all.ts                        Task 11
```

---

## Task 1: Monorepo 골격 부트스트랩

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `mise.toml`
- Create: `tsconfig.base.json`
- Create: `.npmrc`
- Create: `.editorconfig`

- [ ] **Step 1: 루트 `package.json` 작성**

```json
{
  "name": "pokedex-agent",
  "private": true,
  "version": "0.0.0",
  "engines": {
    "pnpm": ">=10.0.0",
    "node": ">=24.0.0"
  },
  "packageManager": "pnpm@10.23.0",
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "build": "turbo build",
    "dev": "turbo dev",
    "test": "turbo test",
    "fetch:all": "pnpm --filter data-fetchers run fetch:all",
    "clean": "turbo clean && rm -rf .turbo node_modules"
  },
  "devDependencies": {
    "turbo": "^2.9.6",
    "typescript": "~6.0.3"
  }
}
```

- [ ] **Step 2: `pnpm-workspace.yaml` 작성**

```yaml
packages:
  - "packages/*"
```

- [ ] **Step 3: `turbo.json` 작성**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: `mise.toml` 작성**

```toml
[tools]
node = "24"
pnpm = "10.23.0"
```

- [ ] **Step 5: `tsconfig.base.json` 작성**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 6: `.npmrc` 작성**

```
auto-install-peers=true
strict-peer-dependencies=false
```

- [ ] **Step 7: `.editorconfig` 작성**

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

- [ ] **Step 8: 설치 + 검증**

Run: `pnpm install`
Expected: `node_modules/` 생성, `turbo` 설치 확인. `pnpm exec turbo --version` 이 2.x 출력.

- [ ] **Step 9: 커밋**

```bash
git add package.json pnpm-workspace.yaml turbo.json mise.toml tsconfig.base.json .npmrc .editorconfig pnpm-lock.yaml
git commit -m "Task 1: monorepo 골격 부트스트랩"
```

---

## Task 2: `pokedex-core` 패키지 스캐폴딩

**Files:**
- Create: `packages/pokedex-core/package.json`
- Create: `packages/pokedex-core/tsconfig.json`
- Create: `packages/pokedex-core/vitest.config.ts`
- Create: `packages/pokedex-core/src/index.ts`

- [ ] **Step 1: `packages/pokedex-core/package.json`**

```json
{
  "name": "@pokedex-agent/pokedex-core",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./data/*": "./data/*.json",
    "./formula": "./src/formula/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@types/node": "^25.6.0",
    "vitest": "^4.1.5"
  }
}
```

- [ ] **Step 2: `packages/pokedex-core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*", "test/**/*", "data/*.json"]
}
```

- [ ] **Step 3: `packages/pokedex-core/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.spec.ts"],
    globals: false,
  },
});
```

- [ ] **Step 4: `packages/pokedex-core/src/index.ts`**

```typescript
export * from "./types";
export * from "./data";
export * from "./lookup";
export * from "./export";
export * from "./parse";
export * as formula from "./formula";
```

Note: 이 시점에서 types/data/lookup/export/parse/formula는 아직 없으므로 `tsc`가 실패. 다음 task에서 채운다. 잠시 동안 위 import 6줄을 주석 처리하고 빈 export문 추가:

```typescript
export {};
```

이후 각 모듈을 채울 때마다 주석을 해제.

- [ ] **Step 5: 설치 검증**

Run: `pnpm install`
Expected: `@pokedex-agent/pokedex-core`가 workspace로 인식됨.

Run: `pnpm --filter @pokedex-agent/pokedex-core type-check`
Expected: 통과.

- [ ] **Step 6: 커밋**

```bash
git add packages/pokedex-core/ pnpm-lock.yaml
git commit -m "Task 2: pokedex-core 패키지 스캐폴딩"
```

---

## Task 3: Zod 스키마 정의 (`types.ts`)

**Files:**
- Create: `packages/pokedex-core/src/types.ts`
- Create: `packages/pokedex-core/test/types.spec.ts`

- [ ] **Step 1: 실패하는 테스트 작성 — `test/types.spec.ts`**

```typescript
import { describe, expect, it } from "vitest";

import { Party, PartyMember, StatBlock, TypeName, isTypeName } from "../src/types";

describe("타입 스키마", () => {
  it("정상 PartyMember를 파싱한다", () => {
    const member = PartyMember.parse({
      species: "어써러셔",
      level: 50,
      nature: "신중",
      ability: "재생력",
      item: "구애조끼",
      teraType: "강철",
      moves: ["지진", "스톤에지", "기합구슬", "탁쳐서떨구기"],
      evs: { H: 252, A: 4, B: 0, C: 0, D: 252, S: 0 },
      ivs: { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 },
    });
    expect(member.species).toBe("어써러셔");
    expect(member.evs.H).toBe(252);
  });

  it("EV 합계가 510을 넘으면 거부한다", () => {
    expect(() =>
      PartyMember.parse({
        species: "어써러셔",
        level: 50,
        nature: "신중",
        ability: "재생력",
        teraType: "강철",
        moves: ["지진", "스톤에지", "기합구슬", "탁쳐서떨구기"],
        evs: { H: 252, A: 252, B: 252, C: 0, D: 0, S: 0 },
        ivs: { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 },
      })
    ).toThrow();
  });

  it("Party는 최대 6마리까지 허용한다", () => {
    const member = {
      species: "어써러셔",
      level: 50,
      nature: "신중",
      ability: "재생력",
      teraType: "강철",
      moves: ["지진", "스톤에지", "기합구슬", "탁쳐서떨구기"],
      evs: { H: 252, A: 4, B: 0, C: 0, D: 252, S: 0 },
      ivs: { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 },
    };
    expect(() => Party.parse(Array(7).fill(member))).toThrow();
    expect(() => Party.parse(Array(6).fill(member))).not.toThrow();
  });

  it("isTypeName이 한국어 18타입을 모두 통과시킨다", () => {
    const all: TypeName[] = [
      "노말", "불꽃", "물", "풀", "전기", "얼음", "격투", "독",
      "땅", "비행", "에스퍼", "벌레", "바위", "고스트", "드래곤", "악",
      "강철", "페어리",
    ];
    for (const t of all) expect(isTypeName(t)).toBe(true);
    expect(isTypeName("스텔라")).toBe(false);
    expect(isTypeName("Steel")).toBe(false);
  });

  it("StatBlock의 모든 값은 0 이상 252 이하의 정수다", () => {
    expect(() => StatBlock.parse({ H: -1, A: 0, B: 0, C: 0, D: 0, S: 0 })).toThrow();
    expect(() => StatBlock.parse({ H: 253, A: 0, B: 0, C: 0, D: 0, S: 0 })).toThrow();
    expect(() => StatBlock.parse({ H: 100, A: 0, B: 0, C: 0, D: 0, S: 0 })).not.toThrow();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test`
Expected: 모듈을 찾을 수 없다는 오류로 FAIL.

- [ ] **Step 3: `packages/pokedex-core/src/types.ts` 작성**

```typescript
import { z } from "zod";

export const TYPE_NAMES = [
  "노말", "불꽃", "물", "풀", "전기", "얼음",
  "격투", "독", "땅", "비행", "에스퍼", "벌레",
  "바위", "고스트", "드래곤", "악", "강철", "페어리",
] as const;

export const TypeName = z.enum(TYPE_NAMES);
export type TypeName = z.infer<typeof TypeName>;

export const isTypeName = (value: unknown): value is TypeName =>
  TypeName.safeParse(value).success;

export const TeraType = z.union([TypeName, z.literal("스텔라")]);
export type TeraType = z.infer<typeof TeraType>;

export const NATURE_NAMES = [
  "노력", "외로움", "용감", "장난꾸러기", "고집",
  "대담", "성격없음", "무사태평", "건방짐", "차분",
  "수줍음", "냉정", "온순", "덜렁댐", "조심스러움",
  "얌전함", "촐랑", "변덕쟁이", "겁쟁이", "성급",
  "느긋", "기분파", "온건", "신중", "잘참음",
] as const;

export const NatureName = z.enum(NATURE_NAMES);
export type NatureName = z.infer<typeof NatureName>;

const StatNumber = z.number().int().min(0).max(252);

export const StatBlock = z.object({
  H: StatNumber,
  A: StatNumber,
  B: StatNumber,
  C: StatNumber,
  D: StatNumber,
  S: StatNumber,
});
export type StatBlock = z.infer<typeof StatBlock>;

const IvNumber = z.number().int().min(0).max(31);

export const IvBlock = z.object({
  H: IvNumber,
  A: IvNumber,
  B: IvNumber,
  C: IvNumber,
  D: IvNumber,
  S: IvNumber,
});
export type IvBlock = z.infer<typeof IvBlock>;

export const PERFECT_IVS: IvBlock = { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 };

const evSum = (b: StatBlock) => b.H + b.A + b.B + b.C + b.D + b.S;

export const PartyMember = z
  .object({
    species: z.string().min(1),
    level: z.number().int().min(1).max(100).default(50),
    nature: NatureName,
    ability: z.string().min(1),
    item: z.string().optional(),
    teraType: TeraType,
    moves: z.array(z.string().min(1)).length(4),
    evs: StatBlock,
    ivs: IvBlock.default(PERFECT_IVS),
  })
  .refine((m) => evSum(m.evs) <= 510, {
    message: "노력치 합계는 510을 넘을 수 없다",
    path: ["evs"],
  });
export type PartyMember = z.infer<typeof PartyMember>;

export const Party = z.array(PartyMember).min(1).max(6);
export type Party = z.infer<typeof Party>;

export const Weather = z.enum(["맑음", "비", "모래바람", "눈"]);
export type Weather = z.infer<typeof Weather>;

export const Terrain = z.enum(["그래스필드", "미스트필드", "사이코필드", "일렉트릭필드"]);
export type Terrain = z.infer<typeof Terrain>;

export const StatusCondition = z.enum(["화상", "독", "맹독", "마비", "잠듦", "얼음"]);
export type StatusCondition = z.infer<typeof StatusCondition>;

const RankNumber = z.number().int().min(-6).max(6);

export const RankBlock = z.object({
  A: RankNumber.default(0),
  B: RankNumber.default(0),
  C: RankNumber.default(0),
  D: RankNumber.default(0),
  S: RankNumber.default(0),
  accuracy: RankNumber.default(0),
  evasion: RankNumber.default(0),
});
export type RankBlock = z.infer<typeof RankBlock>;

export const FieldSlot = z.object({
  member: PartyMember,
  hpPercent: z.number().min(0).max(100).default(100),
  ranks: RankBlock.default({
    A: 0, B: 0, C: 0, D: 0, S: 0, accuracy: 0, evasion: 0,
  }),
  status: StatusCondition.optional(),
  terastalized: z.boolean().default(false),
});
export type FieldSlot = z.infer<typeof FieldSlot>;

export const BattleState = z.object({
  my: Party,
  opponent: z.object({
    revealed: z.array(PartyMember.partial()).max(6),
    field: z.array(FieldSlot).max(1),
  }),
  myField: z.array(FieldSlot).max(1).default([]),
  weather: Weather.optional(),
  terrain: Terrain.optional(),
  trickRoom: z.boolean().default(false),
  turn: z.number().int().min(1).default(1),
});
export type BattleState = z.infer<typeof BattleState>;

export const PokedexEntry = z.object({
  no: z.number().int().min(1),
  ko: z.string(),
  en: z.string(),
  generation: z.number().int().min(1).max(9),
  types: z.array(TypeName).min(1).max(2),
  types_en: z.array(z.string()).min(1).max(2),
  past_types: z.array(z.unknown()).default([]),
});
export type PokedexEntry = z.infer<typeof PokedexEntry>;

export const PokedexFile = z.object({
  source: z.string(),
  generated_at_utc: z.string(),
  generations: z.string(),
  count: z.number().int(),
  type_map_ko: z.record(z.string(), z.string()),
  entries: z.array(PokedexEntry),
});
export type PokedexFile = z.infer<typeof PokedexFile>;
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test`
Expected: 5 tests pass.

- [ ] **Step 5: `src/index.ts`에서 `./types` 주석 해제**

```typescript
export * from "./types";
export {};  // 다른 모듈이 채워질 때까지 보존
```

- [ ] **Step 6: 커밋**

```bash
git add packages/pokedex-core/src/types.ts packages/pokedex-core/test/types.spec.ts packages/pokedex-core/src/index.ts
git commit -m "Task 3: Zod 스키마 정의 (Party·BattleState·도감)"
```

---

## Task 4: 도감 데이터 마이그레이션 + `data.ts`

**Files:**
- Move: `.claude/data/pokedex.json` → `packages/pokedex-core/data/pokedex.json`
- Create: `packages/pokedex-core/src/data.ts`

- [ ] **Step 1: 데이터 파일 이동**

```bash
mkdir -p packages/pokedex-core/data
git mv .claude/data/pokedex.json packages/pokedex-core/data/pokedex.json
```

- [ ] **Step 2: `src/data.ts` 작성 (정적 import + Zod 검증)**

```typescript
import { PokedexFile } from "./types";
import pokedexRaw from "../data/pokedex.json" with { type: "json" };

export const pokedex = PokedexFile.parse(pokedexRaw);

export const pokedexByNo = new Map(pokedex.entries.map((e) => [e.no, e]));
export const pokedexByKo = new Map(pokedex.entries.map((e) => [e.ko, e]));
export const pokedexByEn = new Map(pokedex.entries.map((e) => [e.en, e]));
```

- [ ] **Step 3: 검증 테스트 — `test/types.spec.ts`에 추가**

`test/types.spec.ts` 의 import에 추가:

```typescript
import { pokedex, pokedexByKo } from "../src/data";
```

새 `describe` 블록 추가:

```typescript
describe("도감 데이터", () => {
  it("1025마리가 로드된다", () => {
    expect(pokedex.count).toBe(1025);
    expect(pokedex.entries).toHaveLength(1025);
  });

  it("한국어명으로 조회한다", () => {
    expect(pokedexByKo.get("이상해씨")?.no).toBe(1);
    expect(pokedexByKo.get("피카츄")?.no).toBe(25);
    expect(pokedexByKo.get("뮤츠")?.no).toBe(150);
    expect(pokedexByKo.get("복숭악동")?.no).toBe(1025);
  });

  it("모든 엔트리가 한국어명을 갖는다", () => {
    for (const entry of pokedex.entries) {
      expect(entry.ko).toBeTruthy();
      expect(entry.ko.length).toBeGreaterThan(0);
    }
  });

  it("모든 엔트리의 타입이 18타입 중 하나다", () => {
    for (const entry of pokedex.entries) {
      for (const t of entry.types) {
        expect([
          "노말", "불꽃", "물", "풀", "전기", "얼음", "격투", "독",
          "땅", "비행", "에스퍼", "벌레", "바위", "고스트", "드래곤", "악",
          "강철", "페어리",
        ]).toContain(t);
      }
    }
  });
});
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test`
Expected: 9 tests pass.

- [ ] **Step 5: `src/index.ts`에 `./data` 추가**

```typescript
export * from "./types";
export * from "./data";
```

- [ ] **Step 6: 커밋**

```bash
git add packages/pokedex-core/data/ packages/pokedex-core/src/data.ts packages/pokedex-core/test/types.spec.ts packages/pokedex-core/src/index.ts
git commit -m "Task 4: 도감 데이터 마이그레이션 (.claude → packages/pokedex-core)"
```

---

## Task 5: `data-fetchers` 패키지 + 공통 HTTP 클라이언트

**Files:**
- Create: `packages/data-fetchers/package.json`
- Create: `packages/data-fetchers/tsconfig.json`
- Create: `packages/data-fetchers/src/pokeapi.ts`

- [ ] **Step 1: `packages/data-fetchers/package.json`**

```json
{
  "name": "@pokedex-agent/data-fetchers",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "type-check": "tsc --noEmit",
    "fetch:pokedex": "tsx src/fetch-pokedex.ts",
    "fetch:types": "tsx src/fetch-types.ts",
    "fetch:moves": "tsx src/fetch-moves.ts",
    "fetch:abilities": "tsx src/fetch-abilities.ts",
    "fetch:items": "tsx src/fetch-items.ts",
    "fetch:all": "tsx src/fetch-all.ts"
  },
  "dependencies": {
    "@pokedex-agent/pokedex-core": "workspace:*",
    "p-limit": "^7.2.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@types/node": "^25.6.0",
    "tsx": "^4.21.0"
  }
}
```

- [ ] **Step 2: `packages/data-fetchers/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: `packages/data-fetchers/src/pokeapi.ts` — 공통 클라이언트**

```typescript
import pLimit from "p-limit";

const BASE = "https://pokeapi.co/api/v2";
const USER_AGENT = "pokedex-agent/data-fetchers";
const RETRIES = 4;

export const concurrency = pLimit(32);

export const fetchJson = async <T>(path: string): Promise<T> => {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  let lastError: unknown;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw new Error(`fetch 실패: ${url} :: ${String(lastError)}`);
};

export const pickKo = (names: ReadonlyArray<{ language: { name: string }; name: string }>): string | undefined =>
  names.find((n) => n.language.name === "ko")?.name;

export const generationToInt = (slug: string): number => {
  const roman = slug.replace(/^generation-/, "").toUpperCase();
  const table: Record<string, number> = { I: 1, V: 5, X: 10 };
  let total = 0;
  let prev = 0;
  for (const ch of [...roman].reverse()) {
    const value = table[ch];
    if (value === undefined) throw new Error(`알 수 없는 세대 슬러그: ${slug}`);
    total = value < prev ? total - value : total + value;
    prev = value;
  }
  return total;
};

export const announce = (label: string, done: number, total: number): void => {
  if (done === total || done % 50 === 0) {
    process.stderr.write(`  [${label}] ${done}/${total}\n`);
  }
};
```

- [ ] **Step 4: 설치 + 타입 검증**

Run: `pnpm install`
Expected: `tsx`, `p-limit` 설치.

Run: `pnpm --filter @pokedex-agent/data-fetchers type-check`
Expected: 통과.

- [ ] **Step 5: 커밋**

```bash
git add packages/data-fetchers/ pnpm-lock.yaml
git commit -m "Task 5: data-fetchers 패키지 + PokeAPI 공통 클라이언트"
```

---

## Task 6: 타입 데이터 수집 — `fetch-types.ts`

**Files:**
- Create: `packages/data-fetchers/src/fetch-types.ts`
- Output: `packages/pokedex-core/data/types.json`

- [ ] **Step 1: `fetch-types.ts` 작성**

```typescript
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { announce, concurrency, fetchJson, pickKo } from "./pokeapi";

type TypeResponse = {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
  damage_relations: {
    double_damage_from: Array<{ name: string }>;
    half_damage_from: Array<{ name: string }>;
    no_damage_from: Array<{ name: string }>;
  };
};

const TYPE_COUNT = 18;

const OUT = resolve(import.meta.dirname, "../../pokedex-core/data/types.json");

const main = async () => {
  const results = await Promise.all(
    Array.from({ length: TYPE_COUNT }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        const data = await fetchJson<TypeResponse>(`/type/${i}/`);
        return data;
      })
    )
  );

  for (let i = 0; i < results.length; i++) announce("types", i + 1, TYPE_COUNT);

  const slugToKo: Record<string, string> = {};
  for (const t of results) {
    const ko = pickKo(t.names);
    if (!ko) throw new Error(`타입 한국어명 누락: ${t.name}`);
    slugToKo[t.name] = ko;
  }

  // 상성: 공격 타입 → 방어 타입 → 배율
  const matchup: Record<string, Record<string, number>> = {};
  for (const t of results) {
    const attackKo = slugToKo[t.name];
    const row: Record<string, number> = {};
    for (const defender of Object.values(slugToKo)) row[defender] = 1;
    for (const d of t.damage_relations.double_damage_from) row[slugToKo[d.name]!] = 2;
    for (const d of t.damage_relations.half_damage_from) row[slugToKo[d.name]!] = 0.5;
    for (const d of t.damage_relations.no_damage_from) row[slugToKo[d.name]!] = 0;
    matchup[attackKo] = row;
  }

  // 위 매트릭스는 "이 타입(공격)이 받을 때"의 배율. 우리는 "공격 → 방어"로 뒤집어야 한다.
  // damage_relations는 PokeAPI 기준 "방어 입장에서 받는 배율" 이므로 매트릭스 행/열을 의도대로 재계산.
  const final: Record<string, Record<string, number>> = {};
  for (const attacker of Object.values(slugToKo)) {
    final[attacker] = {};
    for (const defender of Object.values(slugToKo)) {
      // 방어 타입 t의 damage_relations.double_damage_from 안에 공격 타입이 들어 있으면 ×2
      const defenderRow = results.find((r) => slugToKo[r.name] === defender)!;
      const isDouble = defenderRow.damage_relations.double_damage_from.some(
        (d) => slugToKo[d.name] === attacker
      );
      const isHalf = defenderRow.damage_relations.half_damage_from.some(
        (d) => slugToKo[d.name] === attacker
      );
      const isZero = defenderRow.damage_relations.no_damage_from.some(
        (d) => slugToKo[d.name] === attacker
      );
      if (isZero) final[attacker][defender] = 0;
      else if (isDouble) final[attacker][defender] = 2;
      else if (isHalf) final[attacker][defender] = 0.5;
      else final[attacker][defender] = 1;
    }
  }

  const payload = {
    source: "PokeAPI v2",
    generated_at_utc: new Date().toISOString(),
    types_ko_to_en: Object.fromEntries(
      Object.entries(slugToKo).map(([en, ko]) => [ko, en])
    ),
    types_en_to_ko: slugToKo,
    matchup: final,
  };

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  process.stderr.write(`[done] ${OUT}\n`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: 실행 + 멱등성 검증**

Run: `pnpm --filter @pokedex-agent/data-fetchers fetch:types`
Expected: `[done] .../data/types.json` 출력.

Run: `git diff packages/pokedex-core/data/types.json | head -5`
Expected: 변경 사항 표시 (새 파일).

Run again: `pnpm --filter @pokedex-agent/data-fetchers fetch:types`
Run: `git diff packages/pokedex-core/data/types.json`
Expected: 빈 출력 (멱등).

- [ ] **Step 3: 데이터 무결성 확인**

Run: `node -e 'const d = require("./packages/pokedex-core/data/types.json"); console.log("types:", Object.keys(d.types_en_to_ko).length); console.log("water vs fire:", d.matchup["물"]["불꽃"]); console.log("electric vs ground:", d.matchup["전기"]["땅"]);'`
Expected: `types: 18`, `water vs fire: 2`, `electric vs ground: 0`.

- [ ] **Step 4: 커밋**

```bash
git add packages/data-fetchers/src/fetch-types.ts packages/pokedex-core/data/types.json
git commit -m "Task 6: 타입 데이터 수집 + 상성 매트릭스 (18타입)"
```

---

## Task 7: 도감 fetcher TypeScript 재작성 — `fetch-pokedex.ts`

**Files:**
- Create: `packages/data-fetchers/src/fetch-pokedex.ts`
- Output: `packages/pokedex-core/data/pokedex.json` (덮어쓰기, 결과 동일해야 함)

- [ ] **Step 1: `fetch-pokedex.ts` 작성**

```typescript
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { announce, concurrency, fetchJson, generationToInt, pickKo } from "./pokeapi";

const TOTAL = 1025;
const TYPE_COUNT = 18;

type SpeciesResponse = {
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
  generation: { name: string };
};

type PokemonResponse = {
  name: string;
  types: Array<{ slot: number; type: { name: string } }>;
  past_types: Array<{
    generation: { name: string };
    types: Array<{ slot: number; type: { name: string } }>;
  }>;
};

type TypeResponse = {
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
};

const OUT = resolve(import.meta.dirname, "../../pokedex-core/data/pokedex.json");

const main = async () => {
  process.stderr.write("[1/3] type map\n");
  const typeMap: Record<string, string> = {};
  await Promise.all(
    Array.from({ length: TYPE_COUNT }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        const data = await fetchJson<TypeResponse>(`/type/${i}/`);
        const ko = pickKo(data.names);
        if (!ko) throw new Error(`타입 한국어명 누락: ${data.name}`);
        typeMap[data.name] = ko;
      })
    )
  );

  process.stderr.write(`[2/3] species 1..${TOTAL}\n`);
  const species: Record<number, { ko: string; generation: number }> = {};
  let done = 0;
  await Promise.all(
    Array.from({ length: TOTAL }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        const data = await fetchJson<SpeciesResponse>(`/pokemon-species/${i}/`);
        const ko = pickKo(data.names);
        if (!ko) throw new Error(`#${i} 한국어명 누락`);
        species[i] = { ko, generation: generationToInt(data.generation.name) };
        announce("species", ++done, TOTAL);
      })
    )
  );

  process.stderr.write(`[3/3] pokemon 1..${TOTAL}\n`);
  const pokemon: Record<number, { en: string; types_en: string[]; past_types: unknown[] }> = {};
  done = 0;
  await Promise.all(
    Array.from({ length: TOTAL }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        const data = await fetchJson<PokemonResponse>(`/pokemon/${i}/`);
        const types_en = [...data.types]
          .sort((a, b) => a.slot - b.slot)
          .map((t) => t.type.name);
        const past_types = data.past_types.map((pt) => ({
          until_generation: generationToInt(pt.generation.name),
          types_en: [...pt.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
        }));
        pokemon[i] = { en: data.name, types_en, past_types };
        announce("pokemon", ++done, TOTAL);
      })
    )
  );

  const entries = Array.from({ length: TOTAL }, (_, i) => {
    const idx = i + 1;
    const sp = species[idx]!;
    const pk = pokemon[idx]!;
    return {
      no: idx,
      ko: sp.ko,
      en: pk.en,
      generation: sp.generation,
      types: pk.types_en.map((t) => typeMap[t] ?? t),
      types_en: pk.types_en,
      past_types: pk.past_types.map((p) => ({
        until_generation: p.until_generation,
        types: p.types_en.map((t) => typeMap[t] ?? t),
        types_en: p.types_en,
      })),
    };
  });

  const payload = {
    source: "PokeAPI v2 (pokeapi.co)",
    generated_at_utc: new Date().toISOString(),
    generations: "1-9",
    count: entries.length,
    type_map_ko: typeMap,
    entries,
  };

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  process.stderr.write(`[done] ${OUT} (${entries.length} entries)\n`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: 실행 + 결과 비교**

Run: `pnpm --filter @pokedex-agent/data-fetchers fetch:pokedex`
Expected: 약 20초 후 `[done]` 출력. count=1025.

Run: `python3 -c "import json; d=json.load(open('packages/pokedex-core/data/pokedex.json')); print(d['count'], d['entries'][0]['ko'], d['entries'][24]['ko'], d['entries'][1024]['ko'])"`
Expected: `1025 이상해씨 피카츄 복숭악동`.

- [ ] **Step 3: 멱등성 검증**

Run: `pnpm --filter @pokedex-agent/data-fetchers fetch:pokedex`
Run: `git diff packages/pokedex-core/data/pokedex.json | head -5`
Expected: `generated_at_utc` 라인 외 변경 없음.

`generated_at_utc`이 매번 바뀌므로 fetcher를 수정해서 안정화:

`fetch-pokedex.ts`의 `generated_at_utc` 라인을 다음으로 변경:

```typescript
generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
```

CI/배치에서는 `GENERATED_AT_UTC=2026-05-21T00:00:00Z pnpm ...`처럼 고정 가능. 로컬 git diff에서 거슬리는 경우 사용.

- [ ] **Step 4: 테스트 재실행 (도감 데이터 무결성)**

Run: `pnpm --filter @pokedex-agent/pokedex-core test`
Expected: 9 tests pass (Task 4 추가분 포함).

- [ ] **Step 5: 커밋**

```bash
git add packages/data-fetchers/src/fetch-pokedex.ts packages/pokedex-core/data/pokedex.json
git commit -m "Task 7: 도감 fetcher TypeScript 재작성 (Python 부산물 대체)"
```

---

## Task 8: 기술 데이터 수집 — `fetch-moves.ts`

**Files:**
- Create: `packages/data-fetchers/src/fetch-moves.ts`
- Output: `packages/pokedex-core/data/moves.json`

- [ ] **Step 1: `fetch-moves.ts` 작성**

```typescript
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { announce, concurrency, fetchJson, pickKo } from "./pokeapi";

type MoveListResponse = {
  count: number;
  results: Array<{ name: string; url: string }>;
};

type MoveResponse = {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
  type: { name: string };
  damage_class: { name: "physical" | "special" | "status" };
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  generation: { name: string };
  flavor_text_entries: Array<{
    language: { name: string };
    flavor_text: string;
    version_group: { name: string };
  }>;
};

type TypeResponse = {
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
};

const OUT = resolve(import.meta.dirname, "../../pokedex-core/data/moves.json");

const damageClassKo: Record<string, string> = {
  physical: "물리",
  special: "특수",
  status: "변화",
};

const main = async () => {
  process.stderr.write("[1/3] type map\n");
  const typeMap: Record<string, string> = {};
  await Promise.all(
    Array.from({ length: 18 }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        const data = await fetchJson<TypeResponse>(`/type/${i}/`);
        const ko = pickKo(data.names);
        if (ko) typeMap[data.name] = ko;
      })
    )
  );

  process.stderr.write("[2/3] move count\n");
  const list = await fetchJson<MoveListResponse>("/move/?limit=1");
  const total = list.count;
  process.stderr.write(`[3/3] moves 1..${total}\n`);

  const moves: Array<Record<string, unknown>> = [];
  let done = 0;
  await Promise.all(
    Array.from({ length: total }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        try {
          const data = await fetchJson<MoveResponse>(`/move/${i}/`);
          const ko = pickKo(data.names);
          if (!ko) return; // 한국어명 없는 기술은 한국 발매에 없음, 스킵
          const flavorKo = data.flavor_text_entries.find(
            (f) => f.language.name === "ko" && f.version_group.name === "scarlet-violet"
          )?.flavor_text;
          moves.push({
            id: data.id,
            ko,
            en: data.name,
            type: typeMap[data.type.name] ?? data.type.name,
            type_en: data.type.name,
            category: damageClassKo[data.damage_class.name] ?? data.damage_class.name,
            category_en: data.damage_class.name,
            power: data.power,
            accuracy: data.accuracy,
            pp: data.pp,
            priority: data.priority,
            flavor_ko: flavorKo ?? null,
          });
        } catch (e) {
          process.stderr.write(`[skip move ${i}]: ${String(e)}\n`);
        }
        announce("moves", ++done, total);
      })
    )
  );

  moves.sort((a, b) => Number(a.id) - Number(b.id));

  writeFileSync(
    OUT,
    JSON.stringify(
      {
        source: "PokeAPI v2",
        generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
        count: moves.length,
        moves,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  process.stderr.write(`[done] ${OUT} (${moves.length} moves)\n`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: 실행**

Run: `pnpm --filter @pokedex-agent/data-fetchers fetch:moves`
Expected: 약 1~2분 후 `[done] .../data/moves.json (XXX moves)` 출력.

- [ ] **Step 3: 무결성 확인**

Run: `node -e 'const d = require("./packages/pokedex-core/data/moves.json"); console.log("count:", d.count); const m = d.moves.find(x => x.ko === "10만볼트"); console.log("10만볼트:", m);'`
Expected: count > 800, "10만볼트" 의 type=전기, category=특수, power=90, pp=15.

- [ ] **Step 4: 멱등성 검증 (`GENERATED_AT_UTC` 고정)**

Run: `GENERATED_AT_UTC=2026-05-21T00:00:00Z pnpm --filter @pokedex-agent/data-fetchers fetch:moves`
Run: `git stash`
Run: `GENERATED_AT_UTC=2026-05-21T00:00:00Z pnpm --filter @pokedex-agent/data-fetchers fetch:moves`
Run: `git diff packages/pokedex-core/data/moves.json`
Expected: 빈 출력 (멱등).
Run: `git stash pop`

- [ ] **Step 5: 커밋**

```bash
git add packages/data-fetchers/src/fetch-moves.ts packages/pokedex-core/data/moves.json
git commit -m "Task 8: 기술 데이터 수집 (한국어명·타입·분류·위력)"
```

---

## Task 9: 특성 데이터 수집 — `fetch-abilities.ts`

**Files:**
- Create: `packages/data-fetchers/src/fetch-abilities.ts`
- Output: `packages/pokedex-core/data/abilities.json`

- [ ] **Step 1: `fetch-abilities.ts` 작성**

```typescript
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { announce, concurrency, fetchJson, pickKo } from "./pokeapi";

type AbilityListResponse = {
  count: number;
  results: Array<{ name: string; url: string }>;
};

type AbilityResponse = {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
  flavor_text_entries: Array<{
    language: { name: string };
    flavor_text: string;
    version_group: { name: string };
  }>;
  effect_entries: Array<{
    language: { name: string };
    effect: string;
    short_effect: string;
  }>;
};

const OUT = resolve(import.meta.dirname, "../../pokedex-core/data/abilities.json");

const main = async () => {
  const list = await fetchJson<AbilityListResponse>("/ability/?limit=1");
  const total = list.count;
  process.stderr.write(`[1/1] abilities 1..${total}\n`);

  const abilities: Array<Record<string, unknown>> = [];
  let done = 0;
  await Promise.all(
    Array.from({ length: total }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        try {
          const data = await fetchJson<AbilityResponse>(`/ability/${i}/`);
          const ko = pickKo(data.names);
          if (!ko) return;
          const flavorKo = data.flavor_text_entries.find(
            (f) => f.language.name === "ko" && f.version_group.name === "scarlet-violet"
          )?.flavor_text;
          abilities.push({
            id: data.id,
            ko,
            en: data.name,
            flavor_ko: flavorKo ?? null,
          });
        } catch (e) {
          process.stderr.write(`[skip ability ${i}]: ${String(e)}\n`);
        }
        announce("abilities", ++done, total);
      })
    )
  );

  abilities.sort((a, b) => Number(a.id) - Number(b.id));

  writeFileSync(
    OUT,
    JSON.stringify(
      {
        source: "PokeAPI v2",
        generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
        count: abilities.length,
        abilities,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  process.stderr.write(`[done] ${OUT} (${abilities.length} abilities)\n`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: 실행**

Run: `pnpm --filter @pokedex-agent/data-fetchers fetch:abilities`
Expected: 약 1분 후 `[done]`.

- [ ] **Step 3: 무결성 확인**

Run: `node -e 'const d = require("./packages/pokedex-core/data/abilities.json"); const a = d.abilities.find(x => x.ko === "재생력"); console.log(a);'`
Expected: ko=재생력, en=regenerator.

- [ ] **Step 4: 커밋**

```bash
git add packages/data-fetchers/src/fetch-abilities.ts packages/pokedex-core/data/abilities.json
git commit -m "Task 9: 특성 데이터 수집 (한국어명·효과 설명)"
```

---

## Task 10: 도구 데이터 수집 — `fetch-items.ts`

**Files:**
- Create: `packages/data-fetchers/src/fetch-items.ts`
- Output: `packages/pokedex-core/data/items.json`

- [ ] **Step 1: `fetch-items.ts` 작성**

```typescript
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { announce, concurrency, fetchJson, pickKo } from "./pokeapi";

type ItemListResponse = {
  count: number;
};

type ItemResponse = {
  id: number;
  name: string;
  names: Array<{ language: { name: string }; name: string }>;
  category: { name: string };
  attributes: Array<{ name: string }>;
  flavor_text_entries: Array<{
    language: { name: string };
    text: string;
    version_group: { name: string };
  }>;
};

const OUT = resolve(import.meta.dirname, "../../pokedex-core/data/items.json");

// SV 배틀에서 의미 있는 카테고리 (배틀용 도구·구애·메가스톤 등)
const BATTLE_CATEGORIES = new Set([
  "held-items", "choice", "type-enhancement", "stat-boosts",
  "training", "plates", "mega-stones", "memories", "z-crystals",
  "species-specific", "type-protection", "all-mail", "in-a-pinch",
  "picky-healing", "type-boosters", "loot", "bad-held-items",
  "effort-training",
]);

const main = async () => {
  const list = await fetchJson<ItemListResponse>("/item/?limit=1");
  const total = list.count;
  process.stderr.write(`[1/1] items 1..${total}\n`);

  const items: Array<Record<string, unknown>> = [];
  let done = 0;
  await Promise.all(
    Array.from({ length: total }, (_, i) => i + 1).map((i) =>
      concurrency(async () => {
        try {
          const data = await fetchJson<ItemResponse>(`/item/${i}/`);
          if (!BATTLE_CATEGORIES.has(data.category.name)) {
            return;
          }
          const ko = pickKo(data.names);
          if (!ko) return;
          const flavorKo = data.flavor_text_entries.find(
            (f) => f.language.name === "ko" && f.version_group.name === "scarlet-violet"
          )?.text;
          items.push({
            id: data.id,
            ko,
            en: data.name,
            category: data.category.name,
            flavor_ko: flavorKo ?? null,
          });
        } catch (e) {
          process.stderr.write(`[skip item ${i}]: ${String(e)}\n`);
        }
        announce("items", ++done, total);
      })
    )
  );

  items.sort((a, b) => Number(a.id) - Number(b.id));

  writeFileSync(
    OUT,
    JSON.stringify(
      {
        source: "PokeAPI v2",
        generated_at_utc: process.env.GENERATED_AT_UTC ?? new Date().toISOString(),
        count: items.length,
        items,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  process.stderr.write(`[done] ${OUT} (${items.length} items)\n`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: 실행**

Run: `pnpm --filter @pokedex-agent/data-fetchers fetch:items`
Expected: 약 2~3분 후 `[done]`.

- [ ] **Step 3: 무결성 확인**

Run: `node -e 'const d = require("./packages/pokedex-core/data/items.json"); const found = (k) => d.items.find(x => x.ko === k); console.log("구애조끼:", found("구애조끼")?.id); console.log("기합의띠:", found("기합의띠")?.id); console.log("생명의구슬:", found("생명의구슬")?.id);'`
Expected: 세 항목 모두 ID 출력.

- [ ] **Step 4: 커밋**

```bash
git add packages/data-fetchers/src/fetch-items.ts packages/pokedex-core/data/items.json
git commit -m "Task 10: 도구 데이터 수집 (배틀 관련 카테고리만)"
```

---

## Task 11: Fetcher 오케스트레이터 — `fetch-all.ts`

**Files:**
- Create: `packages/data-fetchers/src/fetch-all.ts`

- [ ] **Step 1: `fetch-all.ts` 작성**

```typescript
import { spawn } from "node:child_process";

const scripts = [
  "fetch:types",
  "fetch:pokedex",
  "fetch:moves",
  "fetch:abilities",
  "fetch:items",
];

const run = (name: string) =>
  new Promise<void>((resolveScript, rejectScript) => {
    process.stderr.write(`\n=== ${name} ===\n`);
    const child = spawn("pnpm", ["run", name], { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolveScript();
      else rejectScript(new Error(`${name} 실패 (exit ${code})`));
    });
  });

const main = async () => {
  for (const s of scripts) await run(s);
  process.stderr.write("\n=== 모든 fetcher 완료 ===\n");
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: 실행 — 전체 갱신**

Run: `pnpm --filter @pokedex-agent/data-fetchers fetch:all`
Expected: 약 5~7분, 모든 fetcher 통과.

- [ ] **Step 3: 커밋 (데이터 갱신은 의도된 갱신이 아니면 별도 커밋 안 함)**

```bash
git add packages/data-fetchers/src/fetch-all.ts
git commit -m "Task 11: fetcher 오케스트레이터 (fetch:all)"
```

---

## Task 12: 조회 인덱스 — `lookup.ts`

**Files:**
- Create: `packages/pokedex-core/src/lookup.ts`
- Create: `packages/pokedex-core/test/lookup.spec.ts`

- [ ] **Step 1: 실패하는 테스트 — `test/lookup.spec.ts`**

```typescript
import { describe, expect, it } from "vitest";

import { findMove, findPokemon, fuzzyPokemon } from "../src/lookup";

describe("조회", () => {
  it("한국어명으로 포켓몬을 찾는다", () => {
    expect(findPokemon("피카츄")?.no).toBe(25);
    expect(findPokemon("이상해씨")?.no).toBe(1);
    expect(findPokemon("복숭악동")?.no).toBe(1025);
  });

  it("영문명으로도 찾는다", () => {
    expect(findPokemon("pikachu")?.ko).toBe("피카츄");
  });

  it("도감번호로도 찾는다", () => {
    expect(findPokemon(25)?.ko).toBe("피카츄");
  });

  it("한국어 기술명으로 찾는다", () => {
    const move = findMove("10만볼트");
    expect(move?.type).toBe("전기");
    expect(move?.category).toBe("특수");
  });

  it("퍼지 검색이 오타를 허용한다", () => {
    const results = fuzzyPokemon("피가츄", 3);
    expect(results[0]?.ko).toBe("피카츄");
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test test/lookup.spec.ts`
Expected: FAIL (모듈 없음).

- [ ] **Step 3: `src/lookup.ts` 작성**

```typescript
import type { PokedexEntry } from "./types";
import { pokedex, pokedexByEn, pokedexByKo, pokedexByNo } from "./data";

import movesRaw from "../data/moves.json" with { type: "json" };
import abilitiesRaw from "../data/abilities.json" with { type: "json" };
import itemsRaw from "../data/items.json" with { type: "json" };

type MoveData = {
  id: number;
  ko: string;
  en: string;
  type: string;
  type_en: string;
  category: "물리" | "특수" | "변화";
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
};

type AbilityData = { id: number; ko: string; en: string };
type ItemData = { id: number; ko: string; en: string; category: string };

const moves = (movesRaw as { moves: MoveData[] }).moves;
const abilities = (abilitiesRaw as { abilities: AbilityData[] }).abilities;
const items = (itemsRaw as { items: ItemData[] }).items;

const moveByKo = new Map(moves.map((m) => [m.ko, m]));
const moveByEn = new Map(moves.map((m) => [m.en, m]));
const abilityByKo = new Map(abilities.map((a) => [a.ko, a]));
const itemByKo = new Map(items.map((i) => [i.ko, i]));

export const findPokemon = (key: string | number): PokedexEntry | undefined => {
  if (typeof key === "number") return pokedexByNo.get(key);
  return pokedexByKo.get(key) ?? pokedexByEn.get(key.toLowerCase());
};

export const findMove = (key: string): MoveData | undefined =>
  moveByKo.get(key) ?? moveByEn.get(key.toLowerCase());

export const findAbility = (key: string): AbilityData | undefined => abilityByKo.get(key);

export const findItem = (key: string): ItemData | undefined => itemByKo.get(key);

const editDistance = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
};

export const fuzzyPokemon = (query: string, limit = 5): PokedexEntry[] =>
  pokedex.entries
    .map((e) => ({ entry: e, score: Math.min(editDistance(query, e.ko), editDistance(query, e.en)) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((x) => x.entry);

export const allMoves = (): readonly MoveData[] => moves;
export const allAbilities = (): readonly AbilityData[] => abilities;
export const allItems = (): readonly ItemData[] => items;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test`
Expected: 14 tests pass.

- [ ] **Step 5: `src/index.ts` 갱신**

```typescript
export * from "./types";
export * from "./data";
export * from "./lookup";
```

- [ ] **Step 6: 커밋**

```bash
git add packages/pokedex-core/src/lookup.ts packages/pokedex-core/src/index.ts packages/pokedex-core/test/lookup.spec.ts
git commit -m "Task 12: 조회 인덱스 + 퍼지 검색"
```

---

## Task 13: 실수치 공식 — `formula/stat.ts`

**Files:**
- Create: `packages/pokedex-core/src/formula/stat.ts`
- Create: `packages/pokedex-core/src/formula/index.ts`
- Create: `packages/pokedex-core/test/stat.spec.ts`

- [ ] **Step 1: 실패하는 테스트 — `test/stat.spec.ts`**

```typescript
import { describe, expect, it } from "vitest";

import { actualStat, NATURE_TABLE } from "../src/formula/stat";

describe("실수치 공식", () => {
  it("HP 공식이 표준 케이스를 통과한다", () => {
    // 메타몽 HP: 종족 48, EV 252, IV 31, Lv 50 → 162
    expect(actualStat({ stat: "H", base: 48, iv: 31, ev: 252, level: 50, nature: "성격없음" })).toBe(162);
  });

  it("물리 공격 공식이 자속 보정 없이 표준 케이스를 통과한다", () => {
    // 어써러셔 A 종족 105, EV 0, IV 31, Lv 50, 신중 보정 없음 → 116
    expect(actualStat({ stat: "A", base: 105, iv: 31, ev: 0, level: 50, nature: "신중" })).toBe(116);
  });

  it("성격 보정이 1.1배 적용된다", () => {
    // 같은 어써러셔 A에 고집(↑A↓C) 적용 → 116 → 127
    expect(actualStat({ stat: "A", base: 105, iv: 31, ev: 0, level: 50, nature: "고집" })).toBe(127);
  });

  it("성격 보정이 0.9배 적용된다", () => {
    // 같은 어써러셔 A에 차분(↑D↓A) 적용 → 116 → 104
    expect(actualStat({ stat: "A", base: 105, iv: 31, ev: 0, level: 50, nature: "차분" })).toBe(104);
  });

  it("NATURE_TABLE이 25개 성격을 가진다", () => {
    expect(Object.keys(NATURE_TABLE)).toHaveLength(25);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test test/stat.spec.ts`
Expected: FAIL.

- [ ] **Step 3: `src/formula/stat.ts` 작성**

```typescript
import type { NatureName, StatBlock, IvBlock } from "../types";

type Stat = keyof StatBlock;
type NatureModifier = { up?: Exclude<Stat, "H">; down?: Exclude<Stat, "H"> };

export const NATURE_TABLE: Record<NatureName, NatureModifier> = {
  노력: { up: "A", down: "B" },
  외로움: { up: "A", down: "D" },
  용감: { up: "A", down: "S" },
  장난꾸러기: { up: "B", down: "C" },
  고집: { up: "A", down: "C" },
  대담: { up: "B", down: "A" },
  성격없음: {},
  무사태평: {},
  건방짐: { up: "B", down: "S" },
  차분: { up: "D", down: "A" },
  수줍음: {},
  냉정: { up: "C", down: "S" },
  온순: { up: "C", down: "B" },
  덜렁댐: { up: "A", down: "D" },
  조심스러움: { up: "D", down: "C" },
  얌전함: { up: "C", down: "A" },
  촐랑: { up: "S", down: "C" },
  변덕쟁이: {},
  겁쟁이: { up: "S", down: "A" },
  성급: { up: "S", down: "B" },
  느긋: { up: "B", down: "S" },
  기분파: {},
  온건: { up: "D", down: "C" },
  신중: { up: "D", down: "C" },
  잘참음: {},
};

export type ActualStatInput = {
  stat: Stat;
  base: number;
  iv: number;
  ev: number;
  level: number;
  nature: NatureName;
};

const natureMultiplier = (stat: Stat, nature: NatureName): number => {
  if (stat === "H") return 1;
  const mod = NATURE_TABLE[nature];
  if (mod.up === stat) return 1.1;
  if (mod.down === stat) return 0.9;
  return 1;
};

export const actualStat = ({ stat, base, iv, ev, level, nature }: ActualStatInput): number => {
  const evComponent = Math.floor(ev / 4);
  if (stat === "H") {
    if (base === 1) return 1; // 형상변화의 잔재 (1 HP 고정)
    return Math.floor(((2 * base + iv + evComponent) * level) / 100) + level + 10;
  }
  const before = Math.floor(((2 * base + iv + evComponent) * level) / 100) + 5;
  return Math.floor(before * natureMultiplier(stat, nature));
};

export const actualStatBlock = (
  base: StatBlock,
  ev: StatBlock,
  iv: IvBlock,
  level: number,
  nature: NatureName
): StatBlock => ({
  H: actualStat({ stat: "H", base: base.H, iv: iv.H, ev: ev.H, level, nature }),
  A: actualStat({ stat: "A", base: base.A, iv: iv.A, ev: ev.A, level, nature }),
  B: actualStat({ stat: "B", base: base.B, iv: iv.B, ev: ev.B, level, nature }),
  C: actualStat({ stat: "C", base: base.C, iv: iv.C, ev: ev.C, level, nature }),
  D: actualStat({ stat: "D", base: base.D, iv: iv.D, ev: ev.D, level, nature }),
  S: actualStat({ stat: "S", base: base.S, iv: iv.S, ev: ev.S, level, nature }),
});
```

- [ ] **Step 4: `src/formula/index.ts` 작성**

```typescript
export * from "./stat";
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test`
Expected: 19 tests pass.

- [ ] **Step 6: 커밋**

```bash
git add packages/pokedex-core/src/formula/stat.ts packages/pokedex-core/src/formula/index.ts packages/pokedex-core/test/stat.spec.ts
git commit -m "Task 13: 실수치 공식 + 25성격 보정 테이블"
```

---

## Task 14: 타입 상성 — `formula/matchup.ts`

**Files:**
- Create: `packages/pokedex-core/src/formula/matchup.ts`
- Create: `packages/pokedex-core/test/matchup.spec.ts`

- [ ] **Step 1: 실패하는 테스트 — `test/matchup.spec.ts`**

```typescript
import { describe, expect, it } from "vitest";

import { typeEffectiveness } from "../src/formula/matchup";

describe("타입 상성", () => {
  it("물이 불꽃에 2배", () => {
    expect(typeEffectiveness("물", ["불꽃"])).toBe(2);
  });

  it("전기는 땅에게 0배", () => {
    expect(typeEffectiveness("전기", ["땅"])).toBe(0);
  });

  it("얼음이 드래곤·비행 복합에 4배", () => {
    expect(typeEffectiveness("얼음", ["드래곤", "비행"])).toBe(4);
  });

  it("불꽃이 물·바위 복합에 0.25배", () => {
    expect(typeEffectiveness("불꽃", ["물", "바위"])).toBeCloseTo(0.25);
  });

  it("같은 타입의 단일은 1배", () => {
    expect(typeEffectiveness("노말", ["노말"])).toBe(1);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test test/matchup.spec.ts`
Expected: FAIL.

- [ ] **Step 3: `src/formula/matchup.ts` 작성**

```typescript
import typesRaw from "../../data/types.json" with { type: "json" };
import type { TypeName } from "../types";

type TypesFile = {
  matchup: Record<string, Record<string, number>>;
};

const matchup = (typesRaw as TypesFile).matchup;

export const typeEffectiveness = (
  attackType: TypeName,
  defenderTypes: ReadonlyArray<TypeName>
): number => {
  let result = 1;
  for (const defender of defenderTypes) {
    const v = matchup[attackType]?.[defender];
    if (v === undefined) {
      throw new Error(`알 수 없는 타입 조합: ${attackType} vs ${defender}`);
    }
    result *= v;
  }
  return result;
};
```

- [ ] **Step 4: `formula/index.ts` 갱신**

```typescript
export * from "./stat";
export * from "./matchup";
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test`
Expected: 24 tests pass.

- [ ] **Step 6: 커밋**

```bash
git add packages/pokedex-core/src/formula/matchup.ts packages/pokedex-core/src/formula/index.ts packages/pokedex-core/test/matchup.spec.ts
git commit -m "Task 14: 타입 상성 함수 (단·복합)"
```

---

## Task 15: SV 데미지 공식 — `formula/damage.ts`

**Files:**
- Create: `packages/pokedex-core/src/formula/damage.ts`
- Create: `packages/pokedex-core/test/damage.spec.ts`

> **참고:** 이 공식은 9세대 SV 기준이며 Pokemon Showdown 데미지 계산기와 동일한 라운딩·곱셈 순서를 따른다. 모든 곱셈 후 `Math.floor` 적용. 16개 랜덤 롤(0.85~1.00, 0.01 step).

- [ ] **Step 1: 실패하는 테스트 — `test/damage.spec.ts`**

```typescript
import { describe, expect, it } from "vitest";

import { calculateDamage } from "../src/formula/damage";

describe("SV 데미지 공식", () => {
  it("자속이 없는 일반 물리 공격이 데미지 범위를 반환한다", () => {
    // Lv50, A=130, B=100, 위력 80, 보정 없음
    const result = calculateDamage({
      level: 50,
      attack: 130,
      defense: 100,
      basePower: 80,
      category: "물리",
      attackerTypes: ["격투"],
      defenderTypes: ["노말"],
      moveType: "노말",
      attackerTeraType: undefined,
      attackerTerastalized: false,
      stab: false,
    });
    expect(result.min).toBeGreaterThan(0);
    expect(result.max).toBeGreaterThan(result.min);
    expect(result.rolls).toHaveLength(16);
  });

  it("자속 보정이 1.5배로 적용된다", () => {
    const withStab = calculateDamage({
      level: 50, attack: 130, defense: 100, basePower: 80,
      category: "물리", attackerTypes: ["격투"], defenderTypes: ["노말"],
      moveType: "격투", attackerTeraType: undefined, attackerTerastalized: false,
      stab: true,
    });
    const withoutStab = calculateDamage({
      level: 50, attack: 130, defense: 100, basePower: 80,
      category: "물리", attackerTypes: ["격투"], defenderTypes: ["노말"],
      moveType: "노말", attackerTeraType: undefined, attackerTerastalized: false,
      stab: false,
    });
    // 자속이 1.5배라 데미지 최대가 약 1.5배 (정수 라운딩 영향으로 ±1 허용)
    expect(withStab.max).toBeGreaterThanOrEqual(Math.floor(withoutStab.max * 1.5) - 1);
    expect(withStab.max).toBeLessThanOrEqual(Math.ceil(withoutStab.max * 1.5) + 1);
  });

  it("테라스탈 후 자속 + 원본 자속이 만나면 2.0배가 된다", () => {
    const result = calculateDamage({
      level: 50, attack: 150, defense: 100, basePower: 80,
      category: "물리",
      attackerTypes: ["격투"],
      defenderTypes: ["노말"],
      moveType: "격투",
      attackerTeraType: "격투",
      attackerTerastalized: true,
      stab: true,
    });
    const noTera = calculateDamage({
      level: 50, attack: 150, defense: 100, basePower: 80,
      category: "물리",
      attackerTypes: ["격투"],
      defenderTypes: ["노말"],
      moveType: "격투",
      attackerTeraType: undefined,
      attackerTerastalized: false,
      stab: true,
    });
    // 자속 1.5 + 테라 자속 → 2.0 보정 (1.5 → 2.0)
    expect(result.max).toBeGreaterThan(noTera.max);
  });

  it("타입 상성 2배가 적용된다", () => {
    const result = calculateDamage({
      level: 50, attack: 130, defense: 100, basePower: 80,
      category: "물리", attackerTypes: ["물"], defenderTypes: ["불꽃"],
      moveType: "물", attackerTeraType: undefined, attackerTerastalized: false,
      stab: true,
    });
    expect(result.effectiveness).toBe(2);
  });

  it("타입 상성 0이면 데미지 0", () => {
    const result = calculateDamage({
      level: 50, attack: 130, defense: 100, basePower: 80,
      category: "물리", attackerTypes: ["전기"], defenderTypes: ["땅"],
      moveType: "전기", attackerTeraType: undefined, attackerTerastalized: false,
      stab: true,
    });
    expect(result.max).toBe(0);
    expect(result.min).toBe(0);
    expect(result.effectiveness).toBe(0);
  });

  it("스텔라 테라는 자속 후 1.2배 보정", () => {
    const stellar = calculateDamage({
      level: 50, attack: 150, defense: 100, basePower: 80,
      category: "물리",
      attackerTypes: ["격투"], defenderTypes: ["노말"],
      moveType: "격투",
      attackerTeraType: "스텔라",
      attackerTerastalized: true,
      stab: true,
    });
    const teraSameType = calculateDamage({
      level: 50, attack: 150, defense: 100, basePower: 80,
      category: "물리",
      attackerTypes: ["격투"], defenderTypes: ["노말"],
      moveType: "격투",
      attackerTeraType: "격투",
      attackerTerastalized: true,
      stab: true,
    });
    // 스텔라(첫 사용 시 1.2 자속)와 테라스탈 자속(2.0)을 비교.
    expect(stellar.max).toBeLessThan(teraSameType.max);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test test/damage.spec.ts`
Expected: FAIL.

- [ ] **Step 3: `src/formula/damage.ts` 작성**

```typescript
import type { TypeName, TeraType } from "../types";

import { typeEffectiveness } from "./matchup";

export type DamageCategory = "물리" | "특수";

export type DamageInput = {
  level: number;
  attack: number;          // 실수치 (랭크·도구·특성 미리 반영)
  defense: number;         // 실수치
  basePower: number;
  category: DamageCategory;
  attackerTypes: ReadonlyArray<TypeName>;
  defenderTypes: ReadonlyArray<TypeName>;
  moveType: TypeName;
  attackerTeraType?: TeraType;
  attackerTerastalized: boolean;
  stab: boolean;          // 원본 자속 (테라 전 기준)
  critical?: boolean;
  weatherBoost?: 1 | 1.5 | 0.5; // 날씨에 의한 위력 보정 (불꽃-맑음 1.5, 물-맑음 0.5 등)
  itemMultiplier?: number;       // 도구 종합 보정 (생명의구슬 1.3, 안경 1.2 등)
  burned?: boolean;       // 화상 (물리만 0.5)
};

const RANDOM_ROLLS = [85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] as const;

const stabMultiplier = (input: DamageInput): number => {
  const isOriginalStab = input.attackerTypes.includes(input.moveType);
  const tera = input.attackerTerastalized ? input.attackerTeraType : undefined;

  if (tera === "스텔라") {
    // 스텔라: 자속이면 1.5 → 2.0 같은 가중 없음. 대신 사용 타입당 첫 회 1.2 보정.
    // 단순화: 자속 여부에 따라 1.5 or 1.0 후 1.2 가산.
    return (isOriginalStab ? 1.5 : 1.0) * 1.2;
  }

  if (tera && tera !== "스텔라") {
    const isTeraStab = input.moveType === tera;
    if (isTeraStab && isOriginalStab) return 2.0;
    if (isTeraStab || isOriginalStab) return 1.5;
    return 1.0;
  }

  return isOriginalStab ? 1.5 : 1.0;
};

export type DamageResult = {
  min: number;
  max: number;
  rolls: number[];
  effectiveness: number;
};

export const calculateDamage = (input: DamageInput): DamageResult => {
  const {
    level, attack, defense, basePower,
    moveType, defenderTypes,
    critical = false,
    weatherBoost = 1,
    itemMultiplier = 1,
    burned = false,
  } = input;

  const effectiveness = typeEffectiveness(moveType, defenderTypes);
  if (effectiveness === 0) {
    return { min: 0, max: 0, rolls: Array(16).fill(0), effectiveness: 0 };
  }

  const stab = stabMultiplier(input);
  const critMul = critical ? 1.5 : 1;
  const burnMul = burned && input.category === "물리" ? 0.5 : 1;

  // 기본 데미지
  const base = Math.floor(
    Math.floor(((2 * level) / 5 + 2) * basePower * Math.floor((attack * weatherBoost) / 1)) / defense / 50
  ) + 2;

  // 보정 곱셈 — 각 단계마다 floor
  const withCrit = Math.floor(base * critMul);
  const withStab = Math.floor(withCrit * stab);
  const withType = Math.floor(withStab * effectiveness);
  const withBurn = Math.floor(withType * burnMul);
  const withItem = Math.floor(withBurn * itemMultiplier);

  const rolls = RANDOM_ROLLS.map((r) => Math.floor((withItem * r) / 100));

  return {
    min: rolls[0]!,
    max: rolls[15]!,
    rolls: [...rolls],
    effectiveness,
  };
};
```

- [ ] **Step 4: `formula/index.ts` 갱신**

```typescript
export * from "./stat";
export * from "./matchup";
export * from "./damage";
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test`
Expected: 30 tests pass.

- [ ] **Step 6: 커밋**

```bash
git add packages/pokedex-core/src/formula/damage.ts packages/pokedex-core/src/formula/index.ts packages/pokedex-core/test/damage.spec.ts
git commit -m "Task 15: SV 데미지 공식 (자속·테라·스텔라·상성·도구·날씨·화상)"
```

---

## Task 16: 스피드 공식 — `formula/speed.ts`

**Files:**
- Create: `packages/pokedex-core/src/formula/speed.ts`
- Create: `packages/pokedex-core/test/speed.spec.ts`

- [ ] **Step 1: 실패하는 테스트 — `test/speed.spec.ts`**

```typescript
import { describe, expect, it } from "vitest";

import { effectiveSpeed, fasterSide } from "../src/formula/speed";

describe("스피드 공식", () => {
  it("기본 스피드를 그대로 돌려준다", () => {
    expect(effectiveSpeed({ base: 100 })).toBe(100);
  });

  it("랭크 +1은 1.5배 적용", () => {
    expect(effectiveSpeed({ base: 100, rank: 1 })).toBe(150);
  });

  it("랭크 -2는 2/4 = 0.5배 적용", () => {
    expect(effectiveSpeed({ base: 100, rank: -2 })).toBe(50);
  });

  it("순풍은 마지막에 2배", () => {
    expect(effectiveSpeed({ base: 100, rank: 1, tailwind: true })).toBe(300);
  });

  it("마비는 절반", () => {
    expect(effectiveSpeed({ base: 100, paralyzed: true })).toBe(50);
  });

  it("끈적끈적네트는 1/3로 깎임", () => {
    expect(effectiveSpeed({ base: 99, stickyWeb: true })).toBe(33);
  });

  it("트릭룸 상태에선 느린 쪽이 먼저 행동한다", () => {
    expect(fasterSide({ left: 100, right: 200 }, { trickRoom: false })).toBe("right");
    expect(fasterSide({ left: 100, right: 200 }, { trickRoom: true })).toBe("left");
  });

  it("동률이면 50%로 표시한다", () => {
    expect(fasterSide({ left: 150, right: 150 }, { trickRoom: false })).toBe("tie");
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test test/speed.spec.ts`
Expected: FAIL.

- [ ] **Step 3: `src/formula/speed.ts` 작성**

```typescript
export type SpeedInput = {
  base: number;
  rank?: number; // -6..+6
  tailwind?: boolean;
  paralyzed?: boolean;
  stickyWeb?: boolean;
  itemMultiplier?: number;       // 구애스카프 1.5, 두꺼운자루 0.5 등
  abilityMultiplier?: number;    // 가속 1.5, 모래헤치기 2.0 등 (날씨·특성)
};

const rankMultiplier = (rank: number): number => {
  if (rank >= 0) return (2 + rank) / 2;
  return 2 / (2 - rank);
};

export const effectiveSpeed = (input: SpeedInput): number => {
  const {
    base,
    rank = 0,
    tailwind = false,
    paralyzed = false,
    stickyWeb = false,
    itemMultiplier = 1,
    abilityMultiplier = 1,
  } = input;

  let value = Math.floor(base * rankMultiplier(rank));
  value = Math.floor(value * itemMultiplier);
  value = Math.floor(value * abilityMultiplier);
  if (stickyWeb) value = Math.floor(value / 3);
  if (paralyzed) value = Math.floor(value / 2);
  if (tailwind) value *= 2;
  return value;
};

export type FasterResult = "left" | "right" | "tie";

export const fasterSide = (
  speeds: { left: number; right: number },
  options: { trickRoom: boolean }
): FasterResult => {
  if (speeds.left === speeds.right) return "tie";
  const leftWins = options.trickRoom ? speeds.left < speeds.right : speeds.left > speeds.right;
  return leftWins ? "left" : "right";
};
```

- [ ] **Step 4: `formula/index.ts` 갱신**

```typescript
export * from "./stat";
export * from "./matchup";
export * from "./damage";
export * from "./speed";
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test`
Expected: 38 tests pass.

- [ ] **Step 6: 커밋**

```bash
git add packages/pokedex-core/src/formula/speed.ts packages/pokedex-core/src/formula/index.ts packages/pokedex-core/test/speed.spec.ts
git commit -m "Task 16: 스피드 공식 (랭크·순풍·끈적네트·마비·트릭룸)"
```

---

## Task 17: Claude paste 직렬화 — `export.ts`

**Files:**
- Create: `packages/pokedex-core/src/export.ts`
- Create: `packages/pokedex-core/test/export.spec.ts`

- [ ] **Step 1: 실패하는 테스트**

```typescript
import { describe, expect, it } from "vitest";

import { serializeForClaude } from "../src/export";
import type { BattleState, Party } from "../src/types";

const sampleParty: Party = [
  {
    species: "어써러셔",
    level: 50,
    nature: "신중",
    ability: "재생력",
    item: "구애조끼",
    teraType: "강철",
    moves: ["지진", "스톤에지", "기합구슬", "탁쳐서떨구기"],
    evs: { H: 252, A: 4, B: 0, C: 0, D: 252, S: 0 },
    ivs: { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 },
  },
];

describe("Claude paste 직렬화", () => {
  it("party-analysis 작업 헤더가 첫 줄에 들어간다", () => {
    const text = serializeForClaude("party-analysis", { party: sampleParty });
    const firstLine = text.split("\n")[0]!;
    expect(firstLine).toContain("작업");
    expect(firstLine).toContain("파티 분석");
  });

  it("출력에 JSON 코드블록이 포함된다", () => {
    const text = serializeForClaude("party-analysis", { party: sampleParty });
    expect(text).toMatch(/```json\n[\s\S]+?\n```/);
  });

  it("battle-decision 작업도 직렬화한다", () => {
    const state: BattleState = {
      my: sampleParty,
      opponent: { revealed: [], field: [] },
      myField: [],
      trickRoom: false,
      turn: 3,
    };
    const text = serializeForClaude("battle-decision", { state });
    expect(text).toContain("배틀 의사결정");
    expect(text).toContain("턴");
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test test/export.spec.ts`
Expected: FAIL.

- [ ] **Step 3: `src/export.ts` 작성**

```typescript
import type { BattleState, Party } from "./types";

const TASK_HEADERS = {
  "party-analysis": "## 작업: 파티 분석",
  "matchup-leadrec": "## 작업: 선두 추천",
  "battle-decision": "## 작업: 배틀 의사결정",
} as const;

export type ExportTask = keyof typeof TASK_HEADERS;

const formatMember = (m: Party[number], idx: number): string => {
  const stats = `H${m.evs.H}/A${m.evs.A}/B${m.evs.B}/C${m.evs.C}/D${m.evs.D}/S${m.evs.S}`;
  const item = m.item ?? "(없음)";
  return [
    `${idx + 1}. ${m.species} Lv${m.level}`,
    `   특성: ${m.ability} / 도구: ${item} / 성격: ${m.nature} / 테라: ${m.teraType}`,
    `   기술: ${m.moves.join(", ")}`,
    `   EV: ${stats}`,
  ].join("\n");
};

const partyAnalysisBody = (party: Party): string =>
  [
    "",
    "## 파티",
    party.map(formatMember).join("\n"),
    "",
    "## 요청",
    "- 이 파티의 장점과 약점을 한국 SV 커뮤니티 어휘로 분석",
    "- 견제가 필요한 상위 카운터와, 우리 파티가 막을 수 있는 픽 정리",
    "- 보완할 슬롯이 있다면 슬롯 번호와 함께 제안",
    "- 응답 마지막에 표준 JSON 코드블록을 반드시 포함",
  ].join("\n");

const battleDecisionBody = (state: BattleState): string => {
  const lines: string[] = [];
  lines.push("");
  lines.push(`## 현재 턴: ${state.turn}`);
  if (state.weather) lines.push(`- 날씨: ${state.weather}`);
  if (state.terrain) lines.push(`- 필드: ${state.terrain}`);
  if (state.trickRoom) lines.push(`- 트릭룸: 활성`);
  lines.push("");
  lines.push("## 내 파티");
  lines.push(state.my.map(formatMember).join("\n"));
  lines.push("");
  lines.push("## 상대 공개분");
  if (state.opponent.revealed.length === 0) lines.push("(공개된 정보 없음)");
  else lines.push(JSON.stringify(state.opponent.revealed, null, 2));
  lines.push("");
  lines.push("## 요청");
  lines.push("- 다음 턴 옵션(기술 vs 교체)을 추천하고 각 옵션의 데미지·확률을 제시");
  lines.push("- 응답 마지막에 표준 JSON 코드블록을 반드시 포함");
  return lines.join("\n");
};

const matchupLeadBody = (state: BattleState): string =>
  [
    "",
    "## 내 파티",
    state.my.map(formatMember).join("\n"),
    "",
    "## 상대 공개분",
    state.opponent.revealed.length === 0
      ? "(공개된 정보 없음)"
      : JSON.stringify(state.opponent.revealed, null, 2),
    "",
    "## 요청",
    "- 선두로 낼 후보의 우선순위와 각 선택의 근거",
    "- 상대의 예상 응수 (가능성 높은 순)",
    "- 응답 마지막에 표준 JSON 코드블록을 반드시 포함",
  ].join("\n");

export const serializeForClaude = (
  task: ExportTask,
  payload: { party?: Party; state?: BattleState }
): string => {
  const header = TASK_HEADERS[task];
  let body = "";
  let dataBlock: unknown = {};

  if (task === "party-analysis") {
    if (!payload.party) throw new Error("party-analysis는 party가 필요하다");
    body = partyAnalysisBody(payload.party);
    dataBlock = { task, party: payload.party };
  } else if (task === "battle-decision") {
    if (!payload.state) throw new Error("battle-decision은 state가 필요하다");
    body = battleDecisionBody(payload.state);
    dataBlock = { task, state: payload.state };
  } else {
    if (!payload.state) throw new Error("matchup-leadrec은 state가 필요하다");
    body = matchupLeadBody(payload.state);
    dataBlock = { task, state: payload.state };
  }

  return [
    header,
    body,
    "",
    "## 원본 데이터 (참조용)",
    "```json",
    JSON.stringify(dataBlock, null, 2),
    "```",
  ].join("\n");
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test`
Expected: 41 tests pass.

- [ ] **Step 5: `src/index.ts` 갱신**

```typescript
export * from "./types";
export * from "./data";
export * from "./lookup";
export * from "./export";
export * as formula from "./formula";
```

- [ ] **Step 6: 커밋**

```bash
git add packages/pokedex-core/src/export.ts packages/pokedex-core/src/index.ts packages/pokedex-core/test/export.spec.ts
git commit -m "Task 17: Claude paste 직렬화 (3개 작업 시나리오)"
```

---

## Task 18: Claude 응답 파싱 — `parse.ts`

**Files:**
- Create: `packages/pokedex-core/src/parse.ts`
- Create: `packages/pokedex-core/test/parse.spec.ts`

- [ ] **Step 1: 실패하는 테스트**

```typescript
import { describe, expect, it } from "vitest";

import { parseClaudeResponse } from "../src/parse";

describe("Claude 응답 파싱", () => {
  it("표준 JSON 블록을 추출한다", () => {
    const response = `
파티 분석 결과는 다음과 같다.
- 내구형 중심 구조라 시간 끌기에 강하지만 화력이 부족하다.

\`\`\`json
{
  "task": "party-analysis",
  "summary": "내구형 6풀로 컨디션 좋음",
  "details": [
    { "kind": "weakness", "target": "1번 어써러셔", "text": "전기 4배 카운터가 무섭다", "evidence": {} }
  ],
  "actionable": []
}
\`\`\`
    `;
    const parsed = parseClaudeResponse(response);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.task).toBe("party-analysis");
      expect(parsed.data.details).toHaveLength(1);
    }
  });

  it("JSON이 없으면 실패한다", () => {
    const parsed = parseClaudeResponse("그냥 텍스트만 있음");
    expect(parsed.success).toBe(false);
  });

  it("스키마에 맞지 않으면 실패한다", () => {
    const parsed = parseClaudeResponse('```json\n{"task":"unknown-task"}\n```');
    expect(parsed.success).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test test/parse.spec.ts`
Expected: FAIL.

- [ ] **Step 3: `src/parse.ts` 작성**

```typescript
import { z } from "zod";

export const ClaudeResponseSchema = z.object({
  task: z.enum(["party-analysis", "matchup-leadrec", "battle-decision"]),
  summary: z.string(),
  details: z.array(
    z.object({
      kind: z.enum(["strength", "weakness", "warning", "recommendation"]),
      target: z.string(),
      text: z.string(),
      evidence: z.record(z.string(), z.unknown()).default({}),
    })
  ),
  actionable: z
    .array(
      z.object({
        kind: z.enum(["swap-slot", "change-tera", "change-move", "change-item"]),
        slot: z.number().int().min(1).max(6).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        reason: z.string(),
      })
    )
    .default([]),
  unknownNames: z.array(z.string()).default([]),
});
export type ClaudeResponse = z.infer<typeof ClaudeResponseSchema>;

const JSON_FENCE = /```json\s*\n([\s\S]+?)\n```/i;

export type ParseResult =
  | { success: true; data: ClaudeResponse }
  | { success: false; reason: string; raw: string | null };

export const parseClaudeResponse = (text: string): ParseResult => {
  const match = text.match(JSON_FENCE);
  if (!match) return { success: false, reason: "JSON 코드블록 없음", raw: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1]!);
  } catch (e) {
    return { success: false, reason: `JSON 파싱 실패: ${String(e)}`, raw: match[1] ?? null };
  }

  const result = ClaudeResponseSchema.safeParse(parsed);
  if (!result.success) {
    return { success: false, reason: `스키마 미스: ${result.error.message}`, raw: match[1] ?? null };
  }
  return { success: true, data: result.data };
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @pokedex-agent/pokedex-core test`
Expected: 44 tests pass.

- [ ] **Step 5: `src/index.ts` 갱신**

```typescript
export * from "./types";
export * from "./data";
export * from "./lookup";
export * from "./export";
export * from "./parse";
export * as formula from "./formula";
```

- [ ] **Step 6: 커밋**

```bash
git add packages/pokedex-core/src/parse.ts packages/pokedex-core/src/index.ts packages/pokedex-core/test/parse.spec.ts
git commit -m "Task 18: Claude 응답 파싱 + Zod 검증"
```

---

## Task 19: 데미지 fixture 30케이스 + 라운드트립 통합 검증

**Files:**
- Create: `packages/pokedex-core/test/fixtures/damage-cases.json`
- Create: `packages/pokedex-core/test/integration.spec.ts`

- [ ] **Step 1: `test/fixtures/damage-cases.json` 작성**

다음 JSON은 스마트누오와 Pokemon Showdown에서 동일 입력으로 비교 가능한 30개 시나리오 정의다. 각 케이스의 `expected.min` / `expected.max`는 구현 후 첫 실행에서 산출된 값을 그대로 채워 넣되, **반드시 스마트누오 본가의 동일 입력 결과와 ±0 일치**해야 한다. 일치하지 않으면 공식의 라운딩 단계나 보정 순서를 재확인하고 수정한다.

이 단계의 핵심은 **케이스 입력 조합을 망라하는 것**이며, expected 값 채움은 구현 직후 진행한다.

```json
{
  "_doc": "각 케이스는 calculateDamage 입력 그대로. expected는 첫 실행 후 스마트누오와 대조해 ±0 채운다.",
  "cases": [
    { "id": "basic-1", "label": "일반 물리, 자속 없음, 효과보통",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "노말",
                 "attackerTerastalized": false, "stab": false },
      "expected": { "min": null, "max": null } },
    { "id": "stab-1", "label": "자속 1.5배, 효과보통",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "격투",
                 "attackerTerastalized": false, "stab": true },
      "expected": { "min": null, "max": null } },
    { "id": "tera-same", "label": "테라 자속 + 원본 자속 = 2.0배",
      "input": { "level": 50, "attack": 150, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "격투",
                 "attackerTeraType": "격투", "attackerTerastalized": true, "stab": true },
      "expected": { "min": null, "max": null } },
    { "id": "tera-diff", "label": "테라 새 타입 + 원본 자속 아님 = 1.5배",
      "input": { "level": 50, "attack": 150, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "비행",
                 "attackerTeraType": "비행", "attackerTerastalized": true, "stab": false },
      "expected": { "min": null, "max": null } },
    { "id": "stellar-stab", "label": "스텔라 + 자속 (1.5 × 1.2)",
      "input": { "level": 50, "attack": 150, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "격투",
                 "attackerTeraType": "스텔라", "attackerTerastalized": true, "stab": true },
      "expected": { "min": null, "max": null } },
    { "id": "type-x2", "label": "타입 상성 2배",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["물"], "defenderTypes": ["불꽃"], "moveType": "물",
                 "attackerTerastalized": false, "stab": true },
      "expected": { "min": null, "max": null } },
    { "id": "type-x4", "label": "복합 상성 4배",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "특수",
                 "attackerTypes": ["얼음"], "defenderTypes": ["드래곤", "비행"], "moveType": "얼음",
                 "attackerTerastalized": false, "stab": true },
      "expected": { "min": null, "max": null } },
    { "id": "type-x0_5", "label": "상성 절반",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "특수",
                 "attackerTypes": ["불꽃"], "defenderTypes": ["물"], "moveType": "불꽃",
                 "attackerTerastalized": false, "stab": true },
      "expected": { "min": null, "max": null } },
    { "id": "type-x0_25", "label": "복합 0.25배",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "특수",
                 "attackerTypes": ["불꽃"], "defenderTypes": ["물", "바위"], "moveType": "불꽃",
                 "attackerTerastalized": false, "stab": true },
      "expected": { "min": null, "max": null } },
    { "id": "type-x0", "label": "상성 0",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["전기"], "defenderTypes": ["땅"], "moveType": "전기",
                 "attackerTerastalized": false, "stab": true },
      "expected": { "min": 0, "max": 0 } },
    { "id": "crit", "label": "급소 1.5배",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "격투",
                 "attackerTerastalized": false, "stab": true, "critical": true },
      "expected": { "min": null, "max": null } },
    { "id": "burn", "label": "화상 물리 절반",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "격투",
                 "attackerTerastalized": false, "stab": true, "burned": true },
      "expected": { "min": null, "max": null } },
    { "id": "burn-special-noop", "label": "화상 특수는 영향 없음",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "특수",
                 "attackerTypes": ["불꽃"], "defenderTypes": ["풀"], "moveType": "불꽃",
                 "attackerTerastalized": false, "stab": true, "burned": true },
      "expected": { "min": null, "max": null } },
    { "id": "item-glasses", "label": "안경 1.2배",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "특수",
                 "attackerTypes": ["불꽃"], "defenderTypes": ["풀"], "moveType": "불꽃",
                 "attackerTerastalized": false, "stab": true, "itemMultiplier": 1.2 },
      "expected": { "min": null, "max": null } },
    { "id": "item-band", "label": "구애머리띠 1.5배",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "격투",
                 "attackerTerastalized": false, "stab": true, "itemMultiplier": 1.5 },
      "expected": { "min": null, "max": null } },
    { "id": "item-life-orb", "label": "생명의구슬 1.3배",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "격투",
                 "attackerTerastalized": false, "stab": true, "itemMultiplier": 1.3 },
      "expected": { "min": null, "max": null } },
    { "id": "weather-rain", "label": "비날씨 물 기술 1.5배",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "특수",
                 "attackerTypes": ["물"], "defenderTypes": ["불꽃"], "moveType": "물",
                 "attackerTerastalized": false, "stab": true, "weatherBoost": 1.5 },
      "expected": { "min": null, "max": null } },
    { "id": "weather-sun-vs-water", "label": "맑음에서 물 기술 0.5배",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "특수",
                 "attackerTypes": ["물"], "defenderTypes": ["불꽃"], "moveType": "물",
                 "attackerTerastalized": false, "stab": true, "weatherBoost": 0.5 },
      "expected": { "min": null, "max": null } },
    { "id": "lvl-1", "label": "Lv 1 케이스",
      "input": { "level": 1, "attack": 30, "defense": 20, "basePower": 40, "category": "물리",
                 "attackerTypes": ["벌레"], "defenderTypes": ["풀"], "moveType": "벌레",
                 "attackerTerastalized": false, "stab": true },
      "expected": { "min": null, "max": null } },
    { "id": "lvl-100", "label": "Lv 100 케이스",
      "input": { "level": 100, "attack": 200, "defense": 150, "basePower": 100, "category": "물리",
                 "attackerTypes": ["악"], "defenderTypes": ["에스퍼"], "moveType": "악",
                 "attackerTerastalized": false, "stab": true },
      "expected": { "min": null, "max": null } },
    { "id": "stellar-no-stab", "label": "스텔라 + 자속 아님 (1.0 × 1.2)",
      "input": { "level": 50, "attack": 150, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "비행",
                 "attackerTeraType": "스텔라", "attackerTerastalized": true, "stab": false },
      "expected": { "min": null, "max": null } },
    { "id": "tera-orig-only", "label": "테라 후 원본 자속만 (1.5배)",
      "input": { "level": 50, "attack": 150, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "격투",
                 "attackerTeraType": "비행", "attackerTerastalized": true, "stab": true },
      "expected": { "min": null, "max": null } },
    { "id": "tera-new-only", "label": "테라 후 새 타입만 자속 (1.5배)",
      "input": { "level": 50, "attack": 150, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "비행",
                 "attackerTeraType": "비행", "attackerTerastalized": true, "stab": false },
      "expected": { "min": null, "max": null } },
    { "id": "crit-burn", "label": "급소 + 화상 동시",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "격투",
                 "attackerTerastalized": false, "stab": true, "critical": true, "burned": true },
      "expected": { "min": null, "max": null } },
    { "id": "x4-with-glasses", "label": "4배 상성 + 안경",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "특수",
                 "attackerTypes": ["얼음"], "defenderTypes": ["드래곤", "비행"], "moveType": "얼음",
                 "attackerTerastalized": false, "stab": true, "itemMultiplier": 1.2 },
      "expected": { "min": null, "max": null } },
    { "id": "x0_25-with-life-orb", "label": "0.25배 + 생명의구슬",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "특수",
                 "attackerTypes": ["불꽃"], "defenderTypes": ["물", "바위"], "moveType": "불꽃",
                 "attackerTerastalized": false, "stab": true, "itemMultiplier": 1.3 },
      "expected": { "min": null, "max": null } },
    { "id": "rain-stab-x2", "label": "비날씨 + 자속 + 2배 상성",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 100, "category": "특수",
                 "attackerTypes": ["물"], "defenderTypes": ["땅"], "moveType": "물",
                 "attackerTerastalized": false, "stab": true, "weatherBoost": 1.5 },
      "expected": { "min": null, "max": null } },
    { "id": "tera-stellar-x4", "label": "스텔라 + 자속 + 4배",
      "input": { "level": 50, "attack": 130, "defense": 100, "basePower": 80, "category": "특수",
                 "attackerTypes": ["얼음"], "defenderTypes": ["드래곤", "비행"], "moveType": "얼음",
                 "attackerTeraType": "스텔라", "attackerTerastalized": true, "stab": true },
      "expected": { "min": null, "max": null } },
    { "id": "lvl50-strong", "label": "Lv50 고화력 표준",
      "input": { "level": 50, "attack": 200, "defense": 100, "basePower": 120, "category": "물리",
                 "attackerTypes": ["드래곤"], "defenderTypes": ["격투"], "moveType": "드래곤",
                 "attackerTerastalized": false, "stab": true },
      "expected": { "min": null, "max": null } },
    { "id": "lvl50-weak-def", "label": "Lv50 약방어 케이스",
      "input": { "level": 50, "attack": 130, "defense": 60, "basePower": 80, "category": "물리",
                 "attackerTypes": ["격투"], "defenderTypes": ["노말"], "moveType": "격투",
                 "attackerTerastalized": false, "stab": true },
      "expected": { "min": null, "max": null } }
  ]
}
```

- [ ] **Step 2: `test/integration.spec.ts` 작성 (라운드트립 + fixture 비교)**

```typescript
import { describe, expect, it } from "vitest";

import { parseClaudeResponse } from "../src/parse";
import { serializeForClaude } from "../src/export";
import { calculateDamage } from "../src/formula/damage";
import type { Party } from "../src/types";

import fixtures from "./fixtures/damage-cases.json" with { type: "json" };

describe("Phase 0 통합 검증", () => {
  it("export → JSON 추출 → 같은 task 식별", () => {
    const party: Party = [
      {
        species: "어써러셔",
        level: 50,
        nature: "신중",
        ability: "재생력",
        item: "구애조끼",
        teraType: "강철",
        moves: ["지진", "스톤에지", "기합구슬", "탁쳐서떨구기"],
        evs: { H: 252, A: 4, B: 0, C: 0, D: 252, S: 0 },
        ivs: { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 },
      },
    ];

    const text = serializeForClaude("party-analysis", { party });
    // export 결과에 자체적 JSON 블록은 "원본 데이터" 블록뿐이므로,
    // ClaudeResponseSchema 기준 파싱은 실패해야 한다 (응답 형식이 아니므로).
    const parsed = parseClaudeResponse(text);
    expect(parsed.success).toBe(false);
  });

  it("30케이스 모두 양의 데미지 범위를 반환한다 (예상값 0인 케이스 제외)", () => {
    const cases = (fixtures as { cases: Array<{ id: string; input: Parameters<typeof calculateDamage>[0]; expected: { min: number | null; max: number | null } }> }).cases;
    expect(cases).toHaveLength(30);
    for (const c of cases) {
      const result = calculateDamage(c.input);
      if (c.expected.min === 0) {
        expect(result.max, `case ${c.id}`).toBe(0);
      } else {
        expect(result.max, `case ${c.id}`).toBeGreaterThan(0);
        expect(result.rolls, `case ${c.id}`).toHaveLength(16);
      }
    }
  });
});
```

- [ ] **Step 3: 테스트 실행**

Run: `pnpm --filter @pokedex-agent/pokedex-core test`
Expected: 46 tests pass.

- [ ] **Step 4: 스마트누오 대조 (수기) — expected 값 채움**

각 fixture 케이스를 스마트누오(`https://smartnuo.com/`)에서 동일 입력으로 계산해 `expected.min` / `expected.max`를 채워넣고, 위 통합 테스트에 expected 비교를 추가:

`test/integration.spec.ts` 두 번째 `it` 블록 끝에 다음 추가:

```typescript
      if (c.expected.min !== null && c.expected.max !== null) {
        expect(result.min, `case ${c.id} min`).toBe(c.expected.min);
        expect(result.max, `case ${c.id} max`).toBe(c.expected.max);
      }
```

스마트누오와 결과가 어긋나는 케이스가 있으면:
1. 라운딩 단계 점검 (각 `Math.floor` 적용 위치)
2. 보정 곱셈 순서 점검 (자속 → 상성 → 화상 → 도구 순서)
3. 종족값·실수치 인풋이 동일한지 확인 후 공식 수정
4. 모든 30케이스 ±0 일치할 때까지 반복

- [ ] **Step 5: 전체 회귀 테스트**

Run: `pnpm test`
Expected: 46+ tests pass across all packages.

Run: `pnpm type-check`
Expected: 통과.

- [ ] **Step 6: 커밋**

```bash
git add packages/pokedex-core/test/fixtures/ packages/pokedex-core/test/integration.spec.ts
git commit -m "Task 19: 데미지 30케이스 fixture + 통합 검증"
```

---

## Phase 0 완료 체크리스트

모든 task 후 다음을 확인:

- [ ] `pnpm install` 성공
- [ ] `pnpm test` 모든 패키지 통과 (46+ tests)
- [ ] `pnpm type-check` 통과
- [ ] `pnpm fetch:all` 멱등 (두 번째 실행에서 `GENERATED_AT_UTC` 고정 시 git diff 없음)
- [ ] `.claude/data/pokedex.json` 제거됨 (`packages/pokedex-core/data/`로 이동 완료)
- [ ] 30개 데미지 fixture 모두 스마트누오와 ±0 일치
- [ ] 커밋 단위가 Task 단위로 깨끗함 (`git log --oneline` 으로 확인)

---

## 다음 Phase 예고

Phase 1 (스마트누오 클론 UI)부터는 `apps/client/`에서 `@pokedex-agent/pokedex-core`를 import해 4페이지(`/`, `/speed`, `/docs`, `/party`)를 구성한다. 각 페이지 우상단에 "Claude에 분석 요청" 버튼과 사이드패널 "Claude 답변 붙여넣기"가 들어간다. Phase 1 brainstorming은 Phase 0 완료 후 별도 세션에서 진행한다.
