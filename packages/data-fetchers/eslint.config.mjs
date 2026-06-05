// @ts-check
// noinspection JSCheckFunctionSignatures

import { baseConfig } from '../../eslint.config.base.mjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage', '*.config.ts', 'eslint.config.mjs', 'eslint.config.base.mjs'],
  },
  {
    files: ['**/*.ts'],
    extends: [...baseConfig()],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
