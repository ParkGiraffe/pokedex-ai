import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, UnderscoreNamingStrategy } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';
import { config } from 'dotenv';

import { BattleLog } from './battle-log/battle-log.entity';
import { Preset } from './presets/preset.entity';
import { UsageDaily } from './quota/usage-daily.entity';
import { User } from './users/user.entity';

export const getEnvFilePath = (): string => `.env.${process.env.NODE_ENV ?? 'development'}`;
export const isProduction = (): boolean => process.env.NODE_ENV === 'production';
export const isDevelopment = (): boolean => process.env.NODE_ENV === 'development';

config({ path: getEnvFilePath(), quiet: true });

export default defineConfig({
  dbName: process.env.POSTGRES_DB,
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  entities: [User, Preset, UsageDaily, BattleLog],
  namingStrategy: UnderscoreNamingStrategy,
  metadataProvider: ReflectMetadataProvider,
  debug: false,
  extensions: [Migrator, SeedManager],
  migrations: { path: 'dist/migrations', pathTs: 'migrations', emit: 'ts' },
});
