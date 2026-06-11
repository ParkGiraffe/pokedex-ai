// @ts-check
// noinspection JSCheckFunctionSignatures

// 공유 base eslint 설정. 각 패키지의 eslint.config.mjs가 이 배열을 펼쳐 쓰고
// parserOptions(projectService)·globals·패키지별 룰만 덧붙인다.
//
// 룰 강도 정책 (자원 일원화 + 점진적 강화):
// - import 정렬·unused-imports·prettier/prettier 는 안전하게 auto-fix 되므로 error 유지.
// - type-safety 계열(no-unsafe-*, explicit-module-boundary-types, no-floating-promises)은
//   기존 코드가 이 룰 없이 작성되어 위반이 많고 수동 수정이 위험하므로 우선 warn 으로 둔다.
//   (아래 base 에서 unsafe 계열은 이미 warn, 나머지 완화는 각 패키지 config 참고)

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
        // 아래 type-safety 계열은 기존 코드 위반이 많고 수동 수정이 위험해 우선 warn 으로 완화.
        // (p2z 는 explicit-module-boundary-types 가 error, 나머지 unsafe 계열은 일부만 warn)
        '@typescript-eslint/explicit-module-boundary-types': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/no-base-to-string': 'warn',
        '@typescript-eslint/no-misused-promises': 'warn',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unused-vars': 'off',
        // eslint 권장 룰 중 수동 수정이 필요한 코드품질 룰도 우선 warn (런타임 로직 변경 회피).
        'no-useless-assignment': 'warn',
        'preserve-caught-error': 'warn',
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
      },
    },
  );
}

export default baseConfig;
