import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/paths.ts", "src/gen9-fallback.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  outDir: "dist",
});
