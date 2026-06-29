import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

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
