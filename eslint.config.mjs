import globals from 'globals';
import pluginJs from '@eslint/js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['**/public/**', '**/dist/**'],
  },
  {
    languageOptions: { globals: globals.browser },
    rules: {
      indent: ['error', 2],
      quotes: ['error', 'single'],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'semi': ['error', 'always'],
      'no-unused-vars': 'warn',
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'space-before-function-paren': ['error', 'never'],
    },
  },
  pluginJs.configs.recommended,
];
