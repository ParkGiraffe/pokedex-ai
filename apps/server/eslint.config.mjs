
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
      '@typescript-eslint/no-floating-promises': 'warn',
      'no-console': 'error',
    },
  },
  {
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
