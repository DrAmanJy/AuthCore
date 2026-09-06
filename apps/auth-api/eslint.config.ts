import js from '@eslint/js';
import json from '@eslint/json';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },

  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],

    extends: [js.configs.recommended, ...tseslint.configs.recommended],

    languageOptions: {
      globals: globals.node,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    rules: {
      'no-console': 'warn',
    },
  },

  {
    files: ['**/*.json'],

    plugins: {
      json,
    },

    language: 'json/json',

    extends: ['json/recommended'],
  },
]);