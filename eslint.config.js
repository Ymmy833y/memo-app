/* eslint-disable @typescript-eslint/no-require-imports */

const tseslint = require('typescript-eslint').default;
const { parser } = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: ['**/build/**', '**/dist/**'],
  },
  tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  {
    languageOptions: { parser: parser },
    rules: {
      indent: ['error', 2],
      quotes: ['error', 'single'],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_'
      }],
    }
  }
);
