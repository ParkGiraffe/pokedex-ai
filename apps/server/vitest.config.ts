import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// NestJS 데코레이터 메타데이터 방출을 위해 SWC 트랜스폼 사용(esbuild/oxc는 메타데이터를 못 만든다).
// .swcrc는 nest build용으로 commonjs를 강제하므로, vitest에서는 ESM(es6)으로 명시 오버라이드한다
// (그래야 vitest를 require로 못 불러오는 문제가 안 생긴다).
export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: "es6" },
      jsc: {
        target: "es2022",
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        keepClassNames: true,
      },
    }),
  ],
  oxc: false,
  test: {
    globals: true,
    include: ["src/**/*.spec.ts", "test/**/*.spec.ts"],
    setupFiles: ["test/setup.ts"],
    globalSetup: ["vitest.globalSetup.ts"],
    fileParallelism: false,
  },
});
