import { defineConfig } from "tsup";

// 내부 패키지를 raw .ts로 export하면 컴파일된 NestJS 서버가 소비할 수 없다.
// 단일 자기완결 ESM 번들 + 번들된 .d.ts로 빌드해 NodeNext 소비자(서버)와
// Bundler 소비자(클라이언트) 양쪽에서 확장자 문제 없이 쓰이게 한다.
// data/*.json은 번들에 인라인되고, 외부 fs 접근용 원본은 ./data/* export로 유지.
export default defineConfig({
  // index: 브라우저·서버 공용(노드 전용 코드 없음). node: 서버 전용(DATA_DIR 등 node:url 사용).
  entry: ["src/index.ts", "src/paths.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  outDir: "dist",
});
