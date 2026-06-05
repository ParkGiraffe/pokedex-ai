// @ts-check
// noinspection JSCheckFunctionSignatures

import { baseConfig } from '../../eslint.config.base.mjs';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tailwindCategorized from 'eslint-plugin-tailwindcss-categorized';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage', '*.config.ts', 'eslint.config.mjs', 'eslint.config.base.mjs'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...baseConfig(), reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 2025,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'tailwindcss-categorized': tailwindCategorized,
    },
    rules: {
      'tailwindcss-categorized/ordering': 'warn',
      // set-state-in-effect: 기존 코드 위반 → warn 으로 완화 (런타임 로직 변경 회피)
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    files: ['**/routes/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
);
