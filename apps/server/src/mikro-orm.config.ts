import { ReflectMetadataProvider } from "@mikro-orm/decorators/legacy";
import { Migrator } from "@mikro-orm/migrations";
import { defineConfig, UnderscoreNamingStrategy } from "@mikro-orm/postgresql";
import { SeedManager } from "@mikro-orm/seeder";
import { config } from "dotenv";

import { Preset } from "./presets/preset.entity";
import { User } from "./users/user.entity";

export const getEnvFilePath = (): string => `.env.${process.env.NODE_ENV ?? "development"}`;
export const isProduction = (): boolean => process.env.NODE_ENV === "production";
export const isDevelopment = (): boolean => process.env.NODE_ENV === "development";

// CLI(mikro-orm)·앱·테스트가 모두 이 파일을 불러오므로 여기서 env를 로드한다(이미 로드됐으면 무시).
config({ path: getEnvFilePath(), quiet: true });

// 엔티티는 글롭 대신 명시 배열 — dist/ts·vitest 환경 차이에 영향받지 않는다(새 엔티티는 여기에 추가).
export default defineConfig({
  dbName: process.env.POSTGRES_DB,
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  entities: [User, Preset],
  namingStrategy: UnderscoreNamingStrategy,
  metadataProvider: ReflectMetadataProvider,
  debug: false,
  extensions: [Migrator, SeedManager],
  migrations: { path: "dist/migrations", pathTs: "migrations", emit: "ts" },
});
