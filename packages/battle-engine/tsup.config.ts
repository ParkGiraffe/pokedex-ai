import { defineConfig } from "tsup";

// 단일 자기완결 ESM 번들 + 번들된 .d.ts. 의존성(@smogon/calc, @pokedex-agent/pokedex-core)은
// package.json deps라 자동 external — 런타임에 bare specifier로 해석된다.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  outDir: "dist",
});
