// @ts-check
// noinspection JSCheckFunctionSignatures

import { baseConfig } from '../../eslint.config.base.mjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage', '*.config.ts', 'vitest.globalSetup.ts', 'eslint.config.mjs', 'eslint.config.base.mjs'],
  },
  {
    files: ['**/*.ts'],
    extends: [...baseConfig()],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // no-floating-promises: 기존 코드 위반 다수 → warn 으로 완화 (p2z 는 error)
      '@typescript-eslint/no-floating-promises': 'warn',
      'no-console': 'error',
    },
  },
  {
    // 스펙·부트스트랩 엔트리는 의도된 console 사용 허용
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'src/main.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.controller.ts', '**/*.service.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
);
