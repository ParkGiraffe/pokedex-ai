import { fileURLToPath } from "node:url";

// 번들된 dist/index.js 기준 ../data = 패키지 루트의 data 디렉토리.
// 서버가 OCR 사전용으로 data/*.json을 fs로 읽을 때, 컴파일·재배치돼도 깨지지 않게
// 패키지가 자신의 data 디렉토리 절대 경로를 노출한다.
export const DATA_DIR = fileURLToPath(new URL("../data", import.meta.url));
