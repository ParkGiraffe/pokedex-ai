// @ts-check
// noinspection JSCheckFunctionSignatures

// 공유 base eslint 설정. 각 패키지의 eslint.config.mjs가 이 배열을 펼쳐 쓰고
// parserOptions(projectService)·globals·패키지별 룰만 덧붙인다.
//
// 룰 강도 정책: 전 룰 error. 기존 위반은 2026-06-11 일괄 정리됨(0 warnings 달성 후 승격).
// 예외는 각 패키지 config 참고(예: client의 react-hooks/set-state-in-effect 는 warn).

import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

/**
 * 모든 패키지가 공유하는 base 설정 레이어.
 * @returns {import('typescript-eslint').ConfigArray}
 */
export function baseConfig() {
  return tseslint.config(
    eslint.configs.recommended,
    eslintPluginPrettierRecommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      plugins: {
        'simple-import-sort': simpleImportSort,
        'unused-imports': unusedImports,
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        '@typescript-eslint/no-unsafe-argument': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',
        '@typescript-eslint/no-base-to-string': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-useless-assignment': 'error',
        'preserve-caught-error': 'error',
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
      },
    },
  );
}

export default baseConfig;
