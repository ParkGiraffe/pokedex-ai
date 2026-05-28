import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    // 어드바이저 서버(apps/server, 기본 :3000) 프록시 — 브라우저 교차출처/CORS 회피
    proxy: {
      "/advisor": {
        target: process.env.VITE_ADVISOR_TARGET ?? "http://localhost:3007",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/advisor/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.spec.{ts,tsx}"],
  },
});
